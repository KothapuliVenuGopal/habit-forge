import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";
import { getIo } from "../realtime/socket";

const router = Router();
router.use(requireAuth);

// List recent conversations
router.get("/", async (req, res) => {
  const me = req.user!.sub;
  const recent = await prisma.directMessage.findMany({
    where: { OR: [{ fromId: me }, { toId: me }] },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const seen = new Set<string>();
  const partners: string[] = [];
  for (const m of recent) {
    const other = m.fromId === me ? m.toId : m.fromId;
    if (!seen.has(other)) {
      seen.add(other);
      partners.push(other);
    }
  }
  const profiles = await prisma.profile.findMany({
    where: { id: { in: partners } },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  });
  res.json(profiles);
});

router.get("/:userId", async (req, res) => {
  const me = req.user!.sub;
  const otherId = req.params.userId;
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { fromId: me, toId: otherId },
        { fromId: otherId, toId: me },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  // mark read
  await prisma.directMessage.updateMany({
    where: { fromId: otherId, toId: me, readAt: null },
    data: { readAt: new Date() },
  });
  res.json(messages);
});

const SendSchema = z.object({ body: z.string().trim().min(1).max(2000) });
router.post("/:userId", validateBody(SendSchema), async (req, res) => {
  const me = req.user!.sub;
  const to = await prisma.profile.findUnique({ where: { id: req.params.userId } });
  if (!to) throw new HttpError(404, "Recipient not found");
  if (!to.dmEnabled) throw new HttpError(403, "Recipient does not accept DMs");

  // Block check
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: req.params.userId, blockedId: me },
        { blockerId: me, blockedId: req.params.userId },
      ],
    },
  });
  if (blocked) throw new HttpError(403, "Cannot send message");

  const msg = await prisma.directMessage.create({
    data: { fromId: me, toId: req.params.userId, body: req.body.body },
  });
  getIo()?.to(`user:${req.params.userId}`).emit("dm:receive", msg);
  res.status(201).json(msg);
});

// Block / report / DM toggle
router.post(
  "/block/:userId",
  async (req, res) => {
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: req.user!.sub, blockedId: req.params.userId } },
      create: { blockerId: req.user!.sub, blockedId: req.params.userId },
      update: {},
    });
    res.json({ ok: true });
  },
);

router.post(
  "/report/:userId",
  validateBody(z.object({ reason: z.string().min(2).max(200), context: z.string().max(1000).optional() })),
  async (req, res) => {
    await prisma.report.create({
      data: {
        reporterId: req.user!.sub,
        reportedId: req.params.userId,
        reason: req.body.reason,
        context: req.body.context,
      },
    });
    res.json({ ok: true });
  },
);

export default router;
