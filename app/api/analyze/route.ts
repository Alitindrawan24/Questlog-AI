import { NextResponse, type NextRequest } from "next/server";
import type { Assessment, Habit, Log } from "@/types";

// Always run on the Node.js runtime (needs fetch + env vars); never cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default to a Gemini model served through Google AI Studio's OpenAI-compatible
// endpoint. Override via the AI_MODEL env var (e.g. "gemini-1.5-flash") if needed.
const MODEL = process.env.AI_MODEL ?? "gemini-3.6-flash";

const SYSTEM_PROMPT = `You are an RPG Game Master and Productivity Coach. Analyze the user's weekly habit logs provided below. Identify hidden patterns, struggles, and successes based solely on their notes.
You MUST output ONLY a valid JSON object using this exact schema:
{
  "title": "An epic RPG title earned this week (e.g., The Exhausted Warrior, Iron Novice)",
  "analysis": "2 sentences of deep evaluation highlighting their main obstacle or triumph based on their notes.",
  "next_quest": "1 specific, actionable micro-task or advice for next week."
}`;

/** Build a single context blob from the raw logs for the model.
 *  Resolves each log's habit to a human-readable name when the client also
 *  sends the habits list (falls back to the raw habitId). */
function buildContext(logs: Log[], habits?: Habit[]): string {
  if (logs.length === 0) return "No habit logs were recorded this week.";
  const nameById = new Map<string, string>();
  if (habits) {
    for (const h of habits) nameById.set(h.id, h.name);
  }
  return logs
    .map((l) => `Habit: ${nameById.get(l.habitId) ?? l.habitId}, Note: ${l.note}`)
    .join("\n");
}

/**
 * Robustly extract the Assessment JSON from a model response that may be
 * wrapped in markdown fences or surrounded by stray prose.
 */
function parseAssessment(raw: string): Assessment {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object.");
  }

  const parsed = JSON.parse(candidate.slice(start, end + 1)) as Record<
    string,
    unknown
  >;

  const { title, analysis, next_quest } = parsed;
  if (
    typeof title !== "string" ||
    typeof analysis !== "string" ||
    typeof next_quest !== "string"
  ) {
    throw new Error("Model response did not match the expected schema.");
  }

  return { title, analysis, next_quest };
}

export async function POST(req: NextRequest) {
  // 1. Parse incoming logs (+ optional habits for name resolution).
  let logs: Log[] = [];
  let habits: Habit[] | undefined;
  try {
    const body = await req.json();
    logs = Array.isArray(body?.logs) ? (body.logs as Log[]) : [];
    if (Array.isArray(body?.habits)) habits = body.habits as Habit[];
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (logs.length === 0) {
    return NextResponse.json(
      { error: "No logs to analyze. Complete a few habits first." },
      { status: 400 }
    );
  }

  // 2. Resolve API credentials + endpoint (Google AI Studio / Gemini by default).
  const apiKey = process.env.AISTUDIO_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No AI API key configured. Set AISTUDIO_API_KEY (Google AI Studio / Gemini) in .env.local",
      },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.AI_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai";
  const context = buildContext(logs, habits);

  // 3. Call the OpenAI-compatible chat completions endpoint.
  let aiText: string;
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: context },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `AI provider error (${res.status}): ${errText.slice(0, 500)}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    aiText = data.choices?.[0]?.message?.content ?? "";
    if (!aiText) {
      return NextResponse.json(
        { error: "AI provider returned an empty response." },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: `Failed to reach AI provider: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 502 }
    );
  }

  // 4. Parse + return the structured assessment.
  try {
    const assessment = parseAssessment(aiText);
    return NextResponse.json(assessment);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Could not parse AI response: ${
          err instanceof Error ? err.message : String(err)
        }`,
        raw: aiText,
      },
      { status: 502 }
    );
  }
}
