import { HabitCategory, type PrismaClient } from "@prisma/client";

export const SHIELDS = {
  bronze: { cost: 100, protects: 1, validity: 7, label: "Bronze Shield" },
  silver: { cost: 300, protects: 3, validity: 14, label: "Silver Shield" },
  gold: { cost: 700, protects: 7, validity: 30, label: "Gold Shield" },
} as const;

export type ShieldTier = keyof typeof SHIELDS;

export async function awardCredits(
  prisma: PrismaClient,
  userId: string,
  category: HabitCategory,
  amount: number,
  reason: string,
) {
  await prisma.creditBalance.upsert({
    where: { userId_category: { userId, category } },
    create: {
      userId,
      category,
      balance: amount,
      lifetimeEarned: Math.max(amount, 0),
    },
    update: {
      balance: { increment: amount },
      lifetimeEarned: { increment: Math.max(amount, 0) },
    },
  });
  await prisma.creditTransaction.create({
    data: { userId, category, amount, reason },
  });
}
