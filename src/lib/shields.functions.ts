import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SHIELDS, type ShieldTier } from "./constants";

export const myShields = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Lazy expire
    await context.supabase
      .from("shields")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString());
    const { data, error } = await context.supabase
      .from("shields")
      .select("*")
      .order("purchased_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const myCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("credit_balances").select("*");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const BuyInput = z.object({
  tier: z.enum(["bronze", "silver", "gold"]),
  category: z.enum(["coding", "reading", "gym", "running", "meditation", "fasting", "custom"]),
});

export const buyShield = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BuyInput.parse(input))
  .handler(async ({ context, data }) => {
    const tier = data.tier as ShieldTier;
    const spec = SHIELDS[tier];

    const { data: bal } = await context.supabase
      .from("credit_balances")
      .select("balance")
      .eq("category", data.category)
      .maybeSingle();

    if (!bal || bal.balance < spec.cost) {
      throw new Error(
        `Not enough ${data.category} credits. Need ${spec.cost}, you have ${bal?.balance ?? 0}.`,
      );
    }

    const expires = new Date();
    expires.setDate(expires.getDate() + spec.validity);

    // Deduct credits
    const { error: updErr } = await context.supabase
      .from("credit_balances")
      .update({ balance: bal.balance - spec.cost })
      .eq("user_id", context.userId)
      .eq("category", data.category);
    if (updErr) throw new Error(updErr.message);

    await context.supabase.from("credit_transactions").insert({
      user_id: context.userId,
      category: data.category,
      amount: -spec.cost,
      reason: `Purchased ${spec.label}`,
    });

    const { data: shield, error } = await context.supabase
      .from("shields")
      .insert({
        user_id: context.userId,
        category: data.category,
        tier,
        cost: spec.cost,
        protects_days: spec.protects,
        expires_at: expires.toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return shield;
  });
