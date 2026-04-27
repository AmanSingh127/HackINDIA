import { prisma } from "@/lib/prisma";
import { createGroqClient, getGroqApiKey, getGroqModelName, isGroqRateLimitError } from "@/lib/groq";
import { generateEvaluationForSession, getTemplateInstruction } from "@/lib/interview";
import { MAX_QUESTION_COUNT } from "@/lib/interview-config";

type TranscriptMessage = { role: string; text: string };

function toSse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const { sessionId, message, isInitial } = await req.json();

  if (!sessionId || !message) {
    return new Response(toSse({ type: "error", error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const session = await prisma.interviewSession.findUnique({
          where: { id: sessionId },
          include: { candidate: true, job: true },
        });
        if (!session) {
          controller.enqueue(encoder.encode(toSse({ type: "error", error: "Session not found" })));
          controller.close();
          return;
        }

        let transcript: TranscriptMessage[] = [];
        try {
          transcript = JSON.parse(session.transcript || "[]");
        } catch (error) {
          console.error(error);
        }

        if (!isInitial) {
          transcript.push({ role: "user", text: message });
        }

        const candidateResponsesCount = transcript.filter((item) => item.role === "user").length;
        const shouldAutoComplete = candidateResponsesCount >= MAX_QUESTION_COUNT;
        let aiReply = "";
        let status = session.status;
        let finalSummary: string | null = null;

        const apiKey = getGroqApiKey();
        if (!apiKey) {
          aiReply = isInitial
            ? `Hello ${session.candidate.name}, welcome to the interview for the ${session.job.title} role. Let me start with a scenario — imagine you're building a high-traffic e-commerce platform. How would you design the authentication system to handle millions of concurrent users securely? Walk me through your thought process. (Note: MOCK MODE - Groq API key not set in .env)`
            : "That's an interesting perspective! Can you walk me through how you'd handle that in a real production scenario? (Note: MOCK MODE)";
          controller.enqueue(encoder.encode(toSse({ type: "chunk", text: aiReply })));
        } else {
          const groq = createGroqClient();
          if (!groq) {
            controller.enqueue(encoder.encode(toSse({ type: "error", error: "Groq client initialization failed" })));
            controller.close();
            return;
          }

          const systemInstruction = `
You are a senior technical interviewer hiring for the role of ${session.job.title}.
The candidate's name is ${session.candidate.name}.
Their background: ${session.candidate.resumeText}.
Interview template guidance: ${getTemplateInstruction(session.job.template)}.

IMPORTANT RULES:
1. DO NOT ask coding questions, algorithm puzzles, or ask the candidate to write code. The coding round is already done.
2. Ask SCENARIO-BASED and CONCEPTUAL questions that test the candidate's core understanding of the technology.
3. Ask about real-world situations, system design decisions, debugging approaches, architecture tradeoffs, and how they'd handle production issues.
4. Examples of good questions:
   - "Imagine your API is experiencing 10x traffic spike. Walk me through how you'd handle it."
   - "A production database query suddenly takes 30 seconds instead of 200ms. How would you debug this?"
   - "You need to choose between a monolithic vs microservices architecture for a startup. What factors would you consider?"
   - "How would you design a real-time notification system? What tradeoffs would you make?"
5. Keep responses concise (1-2 short paragraphs).
6. Ask only ONE question at a time.
7. Act like a real, experienced senior engineer — not robotic. Be conversational.
8. If the candidate answers well, briefly acknowledge and go deeper or move to a new topic.
9. If they struggle, give a small hint or move on gracefully.
10. After 5-6 questions, wrap up the interview by thanking them.
11. Start by greeting them warmly and asking your first scenario-based question.
          `;

          const history = transcript.map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text,
          })) as { role: "user" | "assistant"; content: string }[];

          try {
            const completion = await groq.chat.completions.create({
              model: getGroqModelName(),
              stream: true,
              messages: [
                { role: "system", content: systemInstruction },
                ...history,
                {
                  role: "user",
                  content:
                    isInitial
                      ? "Greet the candidate warmly, then ask your first scenario-based question about their domain. Do NOT ask them to write code. Ask about a real-world situation that tests their core understanding and thought process."
                      : shouldAutoComplete
                        ? "This was the final candidate answer. Wrap up the interview in 2-3 lines, thank them, and clearly state interview is complete."
                        : message,
                },
              ],
              temperature: 0.7,
            });

            for await (const chunk of completion) {
              const text = chunk.choices[0]?.delta?.content ?? "";
              if (!text) continue;
              aiReply += text;
              controller.enqueue(encoder.encode(toSse({ type: "chunk", text })));
            }
          } catch (error: unknown) {
            if (isGroqRateLimitError(error)) {
              aiReply = isInitial
                ? `Hello ${session.candidate.name}, welcome to the interview for the ${session.job.title} role. Let's start with a scenario — say your team just deployed a new feature and users are reporting intermittent 500 errors. Walk me through your debugging approach step by step. (Note: Groq rate limit exceeded, running in fallback mode)`
                : "Thanks for your response. Can you give me a concrete real-world example of when you faced something similar? (Note: Groq rate limit exceeded, running in fallback mode)";
              controller.enqueue(encoder.encode(toSse({ type: "chunk", text: aiReply })));
            } else {
              throw error;
            }
          }
        }

        transcript.push({ role: "model", text: aiReply });

        if (shouldAutoComplete) {
          status = "COMPLETED";
        } else if (status === "PENDING") {
          status = "IN_PROGRESS";
        }

        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { transcript: JSON.stringify(transcript), status },
        });

        if (status === "COMPLETED") {
          const evaluation = await generateEvaluationForSession(sessionId);
          finalSummary = evaluation.feedback;
        }

        controller.enqueue(encoder.encode(toSse({ type: "done", status, finalSummary })));
      } catch (error) {
        console.error("Streaming Chat Error:", error);
        controller.enqueue(encoder.encode(toSse({ type: "error", error: "Internal Server Error" })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
