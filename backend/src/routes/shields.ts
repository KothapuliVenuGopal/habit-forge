import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";
import { SHIELDS, type ShieldTier } from "../services/credits";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  // lazy-expire
  await prisma.shield.updateMany({
    where: { userId: req.user!.sub, status: "active", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });
  const shields = await prisma.shield.findMany({
    where: { userId: req.user!.sub },
    orderBy: { purchasedAt: "desc" },
  });
  res.json(shields);
});

const BuySchema = z.object({
  tier: z.enum(["bronze", "silver", "gold"]),
  category: z.enum(["coding", "reading", "gym", "running", "meditation", "fasting", "custom"]),
});

router.post("/buy", validateBody(BuySchema), async (req, res) => {
  const tier = req.body.tier as ShieldTier;
  const spec = SHIELDS[tier];

  const bal = await prisma.creditBalance.findUnique({
    where: { userId_category: { userId: req.user!.sub, category: req.body.category } },
  });
  if (!bal || bal.balance < spec.cost) {
    throw new HttpError(
      400,
      `Not enough ${req.body.category} credits. Need ${spec.cost}, you have ${bal?.balance ?? 0}.`,
    );
  }

  const expiresAt = new Date(Date.now() + spec.validity * 86400000);

  const shield = await prisma.$transaction(async (tx) => {
    await tx.creditBalance.update({
      where: { userId_category: { userId: req.user!.sub, category: req.body.category } },
      data: { balance: { decrement: spec.cost } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: req.user!.sub,
        category: req.body.category,
        amount: -spec.cost,
        reason: `Purchased ${spec.label}`,
      },
    });
    return tx.shield.create({
      data: {
        userId: req.user!.sub,
        category: req.body.category,
        tier,
        cost: spec.cost,
        protectsDays: spec.protects,
        expiresAt,
      },
    });
  });

  res.status(201).json(shield);
});

export default router;
