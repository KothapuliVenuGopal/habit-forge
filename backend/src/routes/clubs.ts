import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";
import { getIo } from "../realtime/socket";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const clubs = await prisma.club.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(clubs);
});

const CreateSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().toLowerCase().min(2).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(500).optional(),
  category: z
    .enum(["coding", "reading", "gym", "running", "meditation", "fasting", "custom"])
    .optional(),
  minStreak: z.number().int().min(0).max(365).default(0),
  isPrivate: z.boolean().default(false),
});

router.post("/", validateBody(CreateSchema), async (req, res) => {
  const exists = await prisma.club.findFirst({
    where: { OR: [{ name: req.body.name }, { slug: req.body.slug }] },
  });
  if (exists) throw new HttpError(409, "Club name or slug taken");
  const club = await prisma.club.create({
    data: {
      ...req.body,
      creatorId: req.user!.sub,
      members: { create: { userId: req.user!.sub, isAdmin: true } },
    },
  });
  res.status(201).json(club);
});

router.get("/:id", async (req, res) => {
  const club = await prisma.club.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: {
          user: { select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } } },
        },
      },
    },
  });
  if (!club) throw new HttpError(404, "Club not found");
  res.json(club);
});

router.post("/:id/join", async (req, res) => {
  const club = await prisma.club.findUnique({ where: { id: req.params.id } });
  if (!club) throw new HttpError(404, "Club not found");
  if (club.minStreak > 0) {
    const profile = await prisma.profile.findUnique({ where: { id: req.user!.sub } });
    if ((profile?.currentStreak ?? 0) < club.minStreak) {
      throw new HttpError(403, `Requires a ${club.minStreak}-day streak`);
    }
  }
  const membership = await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId: req.user!.sub } },
    create: { clubId: club.id, userId: req.user!.sub },
    update: {},
  });
  res.json(membership);
});

router.post("/:id/leave", async (req, res) => {
  await prisma.clubMember.deleteMany({
    where: { clubId: req.params.id, userId: req.user!.sub },
  });
  res.json({ ok: true });
});

router.get("/:id/messages", async (req, res) => {
  const member = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId: req.params.id, userId: req.user!.sub } },
  });
  if (!member) throw new HttpError(403, "Join the club to view messages");
  const messages = await prisma.clubMessage.findMany({
    where: { clubId: req.params.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { profile: { select: { username: true, displayName: true, avatarUrl: true } } } },
    },
  });
  res.json(messages.reverse());
});

const MsgSchema = z.object({ body: z.string().trim().min(1).max(2000) });
router.post("/:id/messages", validateBody(MsgSchema), async (req, res) => {
  const member = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId: req.params.id, userId: req.user!.sub } },
  });
  if (!member) throw new HttpError(403, "Not a member");
  const msg = await prisma.clubMessage.create({
    data: { clubId: req.params.id, userId: req.user!.sub, body: req.body.body },
    include: {
      user: { select: { profile: { select: { username: true, displayName: true, avatarUrl: true } } } },
    },
  });
  getIo()?.to(`club:${req.params.id}`).emit("club:message", msg);
  res.status(201).json(msg);
});

export default router;
