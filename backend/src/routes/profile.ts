import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";

const router = Router();
router.use(requireAuth);

const UpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  username: z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9_]+$/).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  dmEnabled: z.boolean().optional(),
  mentorAvailable: z.boolean().optional(),
  mentorBio: z.string().trim().max(500).optional().nullable(),
});

router.get("/me", async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { id: req.user!.sub } });
  if (!profile) throw new HttpError(404, "Profile not found");
  res.json(profile);
});

router.patch("/me", validateBody(UpdateSchema), async (req, res) => {
  if (req.body.username) {
    const taken = await prisma.profile.findFirst({
      where: { username: req.body.username, NOT: { id: req.user!.sub } },
    });
    if (taken) throw new HttpError(409, "Username taken");
  }
  const updated = await prisma.profile.update({
    where: { id: req.user!.sub },
    data: req.body,
  });
  res.json(updated);
});

router.get("/:username", async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { username: req.params.username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      level: true,
      xp: true,
      currentStreak: true,
      longestStreak: true,
      consistencyScore: true,
      mentorAvailable: true,
      mentorBio: true,
    },
  });
  if (!profile) throw new HttpError(404, "Not found");
  const badges = await prisma.badge.findMany({ where: { userId: profile.id } });
  res.json({ ...profile, badges });
});

export default router;
