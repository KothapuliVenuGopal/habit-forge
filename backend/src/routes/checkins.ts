import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";
import { verifyHabit } from "../lib/ai";
import { applyVerifiedCheckIn } from "../services/streaks";

const router = Router();
router.use(requireAuth);

function todayUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

router.get("/today", async (req, res) => {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId: req.user!.sub, checkDate: todayUtc() },
  });
  res.json(checkIns);
});

router.get("/recent", async (req, res) => {
  const since = new Date(todayUtc());
  since.setUTCDate(since.getUTCDate() - 119);
  const rows = await prisma.checkIn.findMany({
    where: { userId: req.user!.sub, checkDate: { gte: since } },
    select: { checkDate: true, status: true, category: true },
    orderBy: { checkDate: "asc" },
  });
  res.json(rows);
});

const VerifySchema = z.object({
  habitId: z.string().uuid(),
  proof: z
    .object({
      summary: z.string().trim().max(2000).optional(),
      details: z.record(z.string(), z.string()).optional(),
    })
    .default({}),
});

router.post("/verify", validateBody(VerifySchema), async (req, res) => {
  const { habitId, proof } = req.body;
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit || habit.userId !== req.user!.sub) throw new HttpError(404, "Habit not found");

  const proofText = [
    proof.summary ? `Summary: ${proof.summary}` : "",
    ...Object.entries(proof.details ?? {}).map(([k, v]) => `${k}: ${v}`),
  ]
    .filter(Boolean)
    .join("\n");

  const result = await verifyHabit(habit.category, proofText);
  const status = result.passed ? "verified" : "rejected";

  const existing = await prisma.checkIn.findUnique({
    where: { habitId_checkDate: { habitId, checkDate: todayUtc() } },
  });

  const wasVerified = existing?.status === "verified";

  const saved = existing
    ? await prisma.checkIn.update({
        where: { id: existing.id },
        data: {
          status,
          verificationScore: result.score,
          confidenceScore: result.confidence,
          aiFeedback: result as object,
          proofData: proof,
        },
      })
    : await prisma.checkIn.create({
        data: {
          userId: req.user!.sub,
          habitId,
          category: habit.category,
          checkDate: todayUtc(),
          status,
          verificationScore: result.score,
          confidenceScore: result.confidence,
          aiFeedback: result as object,
          proofData: proof,
        },
      });

  if (status === "verified" && !wasVerified) {
    await applyVerifiedCheckIn(prisma, saved);
  }

  res.json({ ...result, status, checkIn: saved });
});

export default router;
