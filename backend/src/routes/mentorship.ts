import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";
import { getIo } from "../realtime/socket";

const router = Router();
router.use(requireAuth);

router.get("/mentors", async (_req, res) => {
  const mentors = await prisma.profile.findMany({
    where: { mentorAvailable: true },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      mentorBio: true,
      level: true,
      longestStreak: true,
      consistencyScore: true,
    },
    take: 100,
    orderBy: { consistencyScore: "desc" },
  });
  res.json(mentors);
});

const ReqSchema = z.object({
  mentorId: z.string().uuid(),
  message: z.string().trim().max(500).optional(),
});
router.post("/request", validateBody(ReqSchema), async (req, res) => {
  if (req.body.mentorId === req.user!.sub) throw new HttpError(400, "Cannot mentor yourself");
  const mentor = await prisma.profile.findUnique({ where: { id: req.body.mentorId } });
  if (!mentor?.mentorAvailable) throw new HttpError(400, "Mentor unavailable");
  const ment = await prisma.mentorship.upsert({
    where: { mentorId_menteeId: { mentorId: req.body.mentorId, menteeId: req.user!.sub } },
    create: {
      mentorId: req.body.mentorId,
      menteeId: req.user!.sub,
      message: req.body.message,
    },
    update: { message: req.body.message, status: "pending" },
  });
  getIo()?.to(`user:${req.body.mentorId}`).emit("mentorship:notify", ment);
  res.status(201).json(ment);
});

router.post("/:id/accept", async (req, res) => {
  const ment = await prisma.mentorship.findUnique({ where: { id: req.params.id } });
  if (!ment || ment.mentorId !== req.user!.sub) throw new HttpError(404, "Not found");
  const updated = await prisma.mentorship.update({
    where: { id: ment.id },
    data: { status: "active" },
  });
  getIo()?.to(`user:${ment.menteeId}`).emit("mentorship:notify", updated);
  res.json(updated);
});

router.post("/:id/decline", async (req, res) => {
  const ment = await prisma.mentorship.findUnique({ where: { id: req.params.id } });
  if (!ment || ment.mentorId !== req.user!.sub) throw new HttpError(404, "Not found");
  const updated = await prisma.mentorship.update({
    where: { id: ment.id },
    data: { status: "declined" },
  });
  res.json(updated);
});

router.get("/active", async (req, res) => {
  const me = req.user!.sub;
  const list = await prisma.mentorship.findMany({
    where: {
      status: "active",
      OR: [{ mentorId: me }, { menteeId: me }],
    },
    include: {
      mentor: { select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } } },
      mentee: { select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } } },
    },
  });
  res.json(list);
});

export default router;
