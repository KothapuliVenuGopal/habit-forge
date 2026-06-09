import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";
import { getIo } from "../realtime/socket";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const me = req.user!.sub;
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ fromId: me }, { toId: me }] },
    include: {
      from: { select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } } },
      to: { select: { id: true, profile: { select: { username: true, displayName: true, avatarUrl: true } } } },
    },
  });
  res.json(rows);
});

const ReqSchema = z.object({ toUserId: z.string().uuid() });
router.post("/request", validateBody(ReqSchema), async (req, res) => {
  if (req.body.toUserId === req.user!.sub) throw new HttpError(400, "Cannot friend yourself");
  const rel = await prisma.friendship.upsert({
    where: { fromId_toId: { fromId: req.user!.sub, toId: req.body.toUserId } },
    create: { fromId: req.user!.sub, toId: req.body.toUserId },
    update: {},
  });
  getIo()?.to(`user:${req.body.toUserId}`).emit("friend:request", rel);
  res.status(201).json(rel);
});

router.post("/:id/accept", async (req, res) => {
  const rel = await prisma.friendship.findUnique({ where: { id: req.params.id } });
  if (!rel || rel.toId !== req.user!.sub) throw new HttpError(404, "Request not found");
  const updated = await prisma.friendship.update({
    where: { id: rel.id },
    data: { status: "accepted" },
  });
  getIo()?.to(`user:${rel.fromId}`).emit("friend:accept", updated);
  res.json(updated);
});

router.post("/:id/decline", async (req, res) => {
  const rel = await prisma.friendship.findUnique({ where: { id: req.params.id } });
  if (!rel || rel.toId !== req.user!.sub) throw new HttpError(404, "Request not found");
  await prisma.friendship.delete({ where: { id: rel.id } });
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  const rel = await prisma.friendship.findUnique({ where: { id: req.params.id } });
  if (!rel || (rel.fromId !== req.user!.sub && rel.toId !== req.user!.sub)) {
    throw new HttpError(404, "Not found");
  }
  await prisma.friendship.delete({ where: { id: rel.id } });
  res.json({ ok: true });
});

export default router;
