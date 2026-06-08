import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIES, type HabitCategory } from "./constants";
import { createLovableAi } from "./ai-gateway.server";

const today = () => new Date().toISOString().slice(0, 10);

export const todaysCheckIns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("check_ins")
      .select("*")
      .eq("check_date", today());
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const recentCheckIns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date();
    since.setDate(since.getDate() - 119);
    const { data, error } = await context.supabase
      .from("check_ins")
      .select("check_date, status, category")
      .gte("check_date", since.toISOString().slice(0, 10))
      .order("check_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const VerifyInput = z.object({
  habit_id: z.string().uuid(),
  category: z.enum(["coding", "reading", "gym", "running", "meditation", "fasting", "custom"]),
  proof: z
    .object({
      summary: z.string().trim().max(2000).optional(),
      details: z.record(z.string(), z.string()).optional(),
    })
    .default({}),
});

export const submitCheckIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VerifyInput.parse(input))
  .handler(async ({ context, data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const category = data.category as HabitCategory;
    const cat = CATEGORIES[category];

    const proofText = [
      data.proof.summary ? `Summary: ${data.proof.summary}` : "",
      ...Object.entries(data.proof.details ?? {}).map(([k, v]) => `${k}: ${v}`),
    ]
      .filter(Boolean)
      .join("\n");

    if (!proofText.trim()) {
      throw new Error("Please provide proof details before submitting.");
    }

    const ai = createLovableAi(apiKey);
    const prompt = `You are ConsiTrack's habit verification AI. Your job is to evaluate whether a user genuinely completed a habit today, based on the proof they submit.

Habit category: ${cat.label}
Category context: ${cat.verifyPrompt}

User submission:
${proofText}

Score the submission from 0-100 based on:
- Specificity and authenticity of details (not generic / templated)
- Plausibility for one day's effort
- Evidence of real engagement

Return STRICTLY a single line of valid JSON, no markdown fences, with this exact shape:
{"score": <0-100 int>, "confidence": <0-100 int>, "passed": <bool>, "feedback": "<1-2 sentence feedback>", "follow_up_question": "<one short question to probe deeper, or empty>"}

passed must be true only if score >= 60.`;

    let result: {
      score: number;
      confidence: number;
      passed: boolean;
      feedback: string;
      follow_up_question?: string;
    };
    try {
      const { text } = await generateText({
        model: ai("google/gemini-2.5-flash"),
        prompt,
        temperature: 0.3,
      });
      const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Surface gateway rate-limit / billing errors cleanly
      if (msg.includes("429")) throw new Error("Rate limited. Please try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Add credits to continue.");
      throw new Error("AI verification failed. Please try again.");
    }

    const status = result.passed ? "verified" : "rejected";

    // Upsert (one check-in per habit per day)
    const { data: existing } = await context.supabase
      .from("check_ins")
      .select("id")
      .eq("habit_id", data.habit_id)
      .eq("check_date", today())
      .maybeSingle();

    if (existing) {
      const { error } = await context.supabase
        .from("check_ins")
        .update({
          status,
          verification_score: result.score,
          confidence_score: result.confidence,
          ai_feedback: result,
          proof_data: data.proof,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("check_ins").insert({
        user_id: context.userId,
        habit_id: data.habit_id,
        category,
        status,
        verification_score: result.score,
        confidence_score: result.confidence,
        ai_feedback: result,
        proof_data: data.proof,
      });
      if (error) throw new Error(error.message);
    }

    return { ...result, status };
  });
