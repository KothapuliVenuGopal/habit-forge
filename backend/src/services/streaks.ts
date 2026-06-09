import type { CheckIn, PrismaClient } from "@prisma/client";
import { awardCredits } from "./credits";

const STREAK_BADGES: Array<[number, string]> = [
  [7, "streak_7"],
  [30, "streak_30"],
  [100, "streak_100"],
  [365, "streak_365"],
];

// Returns the current global streak (days where any verified check-in exists,
// ending on `checkDate`).
async function computeStreak(
  prisma: PrismaClient,
  userId: string,
  checkDate: Date,
): Promise<number> {
  const rows = await prisma.checkIn.findMany({
    where: { userId, status: "verified", checkDate: { lte: checkDate } },
    select: { checkDate: true },
    orderBy: { checkDate: "desc" },
  });
  const seen = new Set(rows.map((r) => r.checkDate.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date(checkDate);
  while (seen.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function applyVerifiedCheckIn(
  prisma: PrismaClient,
  checkIn: CheckIn,
) {
  let award = 10;
  if ((checkIn.verificationScore ?? 0) >= 90) award += 5;

  const streak = await computeStreak(prisma, checkIn.userId, checkIn.checkDate);
  if (streak === 7) award += 50;
  if (streak === 30) award += 200;
  if (streak === 100) award += 1000;

  await prisma.checkIn.update({
    where: { id: checkIn.id },
    data: { creditsAwarded: award },
  });

  await awardCredits(prisma, checkIn.userId, checkIn.category, award, "Verified check-in");

  // Update profile stats
  const [verified, total] = await Promise.all([
    prisma.checkIn.count({ where: { userId: checkIn.userId, status: "verified" } }),
    prisma.checkIn.count({ where: { userId: checkIn.userId } }),
  ]);
  const verificationAccuracy = total > 0 ? Math.floor((verified * 100) / total) : 0;
  const consistencyScore = Math.min(
    100,
    (total > 0 ? Math.floor((verified * 60) / total) : 0) + Math.min(40, streak),
  );

  const profile = await prisma.profile.findUnique({ where: { id: checkIn.userId } });
  const newXp = (profile?.xp ?? 0) + award;
  await prisma.profile.update({
    where: { id: checkIn.userId },
    data: {
      currentStreak: streak,
      longestStreak: Math.max(profile?.longestStreak ?? 0, streak),
      xp: newXp,
      level: 1 + Math.floor(newXp / 500),
      verificationAccuracy,
      consistencyScore,
    },
  });

  // Streak badges
  for (const [threshold, key] of STREAK_BADGES) {
    if (streak >= threshold) {
      await prisma.badge.upsert({
        where: { userId_badgeKey: { userId: checkIn.userId, badgeKey: key } },
        create: { userId: checkIn.userId, badgeKey: key },
        update: {},
      });
    }
  }

  return { award, streak };
}
