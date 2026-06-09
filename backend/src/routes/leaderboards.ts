import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/global", async (_req, res) => {
  const top = await prisma.profile.findMany({
    orderBy: [{ currentStreak: "desc" }, { xp: "desc" }],
    take: 100,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      currentStreak: true,
      longestStreak: true,
      level: true,
      xp: true,
      consistencyScore: true,
    },
  });
  res.json(top);
});

router.get("/category/:category", async (req, res) => {
  const category = req.params.category as
    | "coding"
    | "reading"
    | "gym"
    | "running"
    | "meditation"
    | "fasting"
    | "custom";
  const top = await prisma.creditBalance.findMany({
    where: { category },
    orderBy: { lifetimeEarned: "desc" },
    take: 100,
    include: {
      user: {
        select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } },
      },
    },
  });
  res.json(top);
});

router.get("/friends", async (req, res) => {
  const me = req.user!.sub;
  const friends = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ fromId: me }, { toId: me }] },
  });
  const ids = new Set<string>([me]);
  for (const f of friends) ids.add(f.fromId === me ? f.toId : f.fromId);
  const top = await prisma.profile.findMany({
    where: { id: { in: Array.from(ids) } },
    orderBy: [{ currentStreak: "desc" }, { xp: "desc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      currentStreak: true,
      level: true,
      consistencyScore: true,
    },
  });
  res.json(top);
});

export default router;
