import { prisma } from "@/lib/prisma";
import { createGroqClient, getGroqApiKey, getGroqModelName, isGroqRateLimitError } from "@/lib/groq";

export function getTemplateInstruction(template: string): string {
  switch (template) {
    case "FULLSTACK":
      return "Ask scenario-based questions about full-stack architecture: how they'd design systems end-to-end, handle API scaling, choose databases, debug production issues across frontend and backend, and make technology tradeoffs.";
    case "FRONTEND":
      return "Ask scenario-based questions about frontend architecture: how they'd handle performance bottlenecks, design component systems, manage complex state, ensure accessibility, debug rendering issues, and make UX tradeoffs.";
    case "BACKEND":
      return "Ask scenario-based questions about backend systems: how they'd design APIs for scale, handle database optimization, ensure reliability and fault tolerance, approach microservices vs monolith decisions, and debug production incidents.";
    case "DATA":
      return "Ask scenario-based questions about data systems: how they'd design data pipelines, optimize slow queries, model complex domains, handle data consistency, and communicate analytical findings to non-technical stakeholders.";
    default:
      return "Ask scenario-based questions about real-world software engineering: system design, debugging production issues, architecture decisions, and technology tradeoffs.";
  }
}

export async function generateEvaluationForSession(sessionId: string) {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true, job: true, evaluation: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.evaluation) {
    return session.evaluation;
  }

  const transcript = JSON.parse(session.transcript || "[]") as Array<{ role: string; text: string }>;

  let overallScore = 0;
  let technicalScore = 0;
  let communicationScore = 0;
  let feedback = "";

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    overallScore = 85;
    technicalScore = 80;
    communicationScore = 90;
    feedback = "MOCK EVALUATION: Candidate communicates clearly and has fair technical depth. Add deeper architecture examples.";
  } else {
    const groq = createGroqClient();
    if (!groq) {
      throw new Error("Groq client initialization failed");
    }

    const prompt = `
You are an expert technical evaluator.
Return STRICT JSON with:
{
  "technicalScore": number,
  "communicationScore": number,
  "feedback": "1 concise paragraph",
  "summary": "2-line recruiter summary"
}

Candidate: ${session.candidate.name}
Role: ${session.job.title}
Interview transcript:
${JSON.stringify(transcript)}
    `;

    try {
      const completion = await groq.chat.completions.create({
        model: getGroqModelName(),
        messages: [
          { role: "system", content: "Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      });

      const text = completion.choices[0]?.message?.content ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid evaluation response format");
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        technicalScore?: number;
        communicationScore?: number;
        feedback?: string;
        summary?: string;
      };

      technicalScore = parsed.technicalScore ?? 0;
      communicationScore = parsed.communicationScore ?? 0;
      overallScore = (technicalScore + communicationScore) / 2;
      feedback = [parsed.feedback, parsed.summary].filter(Boolean).join("\n\n");
    } catch (error: unknown) {
      if (isGroqRateLimitError(error)) {
        overallScore = 85;
        technicalScore = 80;
        communicationScore = 90;
        feedback = "FALLBACK EVALUATION: Groq rate limit exceeded. Temporary mock scoring generated.";
      } else {
        throw error;
      }
    }
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      sessionId,
      overallScore,
      technicalScore,
      communicationScore,
      feedback,
    },
  });

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED" },
  });

  return evaluation;
}
