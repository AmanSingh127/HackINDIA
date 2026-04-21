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
            ? `Hello ${session.candidate.name}, welcome to the interview for the ${session.job.title} role. Could you start by telling me a bit about your background? (Note: MOCK MODE - Groq API key not set in .env)`
            : "That's interesting! Can you elaborate more on your experience with this technology? (Note: MOCK MODE)";
          controller.enqueue(encoder.encode(toSse({ type: "chunk", text: aiReply })));
        } else {
          const groq = createGroqClient();
          if (!groq) {
            controller.enqueue(encoder.encode(toSse({ type: "error", error: "Groq client initialization failed" })));
            controller.close();
            return;
          }

          const systemInstruction = `
You are a professional technical interviewer hiring for the role of ${session.job.title}.
The candidate's name is ${session.candidate.name}.
Their background: ${session.candidate.resumeText}.
Interview template guidance: ${getTemplateInstruction(session.job.template)}.

Guidelines:
1. Keep responses concise (1-2 short paragraphs).
2. Ask only ONE question at a time.
3. Do not be overly polite or robotic; act like a real, experienced software engineer.
4. If the candidate answers well, acknowledge it briefly and move to the next technical topic.
5. If they don't know, provide a small hint or move on.
6. After 5-6 questions, wrap up the interview by thanking them.
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
                      ? "Start the interview by introducing yourself briefly and asking the first question."
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
                ? `Hello ${session.candidate.name}, welcome to the interview for the ${session.job.title} role. Could you start by telling me a bit about your background? (Note: Groq rate limit exceeded, running in fallback mode)`
                : "Thanks for your response. Please continue with one concrete example from your past project. (Note: Groq rate limit exceeded, running in fallback mode)";
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
