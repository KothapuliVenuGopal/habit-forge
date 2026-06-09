import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const balances = await prisma.creditBalance.findMany({
    where: { userId: req.user!.sub },
  });
  res.json(balances);
});

router.get("/transactions", async (req, res) => {
  const txns = await prisma.creditTransaction.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(txns);
});

export default router;
