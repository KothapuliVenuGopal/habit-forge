import { config } from "../config";

export interface VerificationResult {
  score: number;
  confidence: number;
  passed: boolean;
  feedback: string;
  follow_up_question?: string;
}

const CATEGORY_PROMPTS: Record<string, string> = {
  coding: "Verify the user genuinely coded today. Ask for what they built, language, problem solved.",
  reading: "Verify reading: book title, pages, key takeaways.",
  gym: "Verify a real workout: exercises, sets/reps/weight, perceived effort.",
  running: "Verify a run: distance, time, route or feel.",
  meditation: "Verify a meditation session: duration, technique, observations.",
  fasting: "Verify a fast: window, how the user feels, what broke/started it.",
  custom: "Verify the user's custom habit with specific, plausible details.",
};

function heuristic(proof: string): VerificationResult {
  const trimmed = proof.trim();
  const score = Math.min(100, Math.max(0, trimmed.length >= 40 ? 70 : trimmed.length * 1.5));
  const passed = score >= 60;
  return {
    score: Math.round(score),
    confidence: 50,
    passed,
    feedback: passed
      ? "Looks plausible. AI is offline; falling back to heuristic check."
      : "Please add more detail about what you actually did today.",
  };
}

export async function verifyHabit(
  category: string,
  proofText: string,
): Promise<VerificationResult> {
  if (!proofText.trim()) {
    return { score: 0, confidence: 100, passed: false, feedback: "No proof provided." };
  }
  if (!config.ai.apiKey) return heuristic(proofText);

  const cat = CATEGORY_PROMPTS[category] ?? CATEGORY_PROMPTS.custom;
  const prompt = `You are ConsiTrack's habit verification AI.
Category: ${category}
Context: ${cat}

User submission:
${proofText}

Score 0-100 based on specificity, authenticity, and plausibility for one day's effort.
Return STRICT JSON, no markdown fences:
{"score":<int>,"confidence":<int>,"passed":<bool>,"feedback":"<1-2 sentences>","follow_up_question":"<short or empty>"}
passed must be true only if score >= 60.`;

  try {
    const resp = await fetch(config.ai.gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });
    if (resp.status === 429) throw new Error("Rate limited. Please try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted.");
    if (!resp.ok) throw new Error(`AI gateway error ${resp.status}`);
    const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned) as VerificationResult;
    parsed.passed = parsed.score >= 60;
    return parsed;
  } catch (e) {
    console.error("[ai] verifyHabit failed, using heuristic:", e);
    return heuristic(proofText);
  }
}
