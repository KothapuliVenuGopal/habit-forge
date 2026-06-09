import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const badges = await prisma.badge.findMany({
    where: { userId: req.user!.sub },
    orderBy: { awardedAt: "desc" },
  });
  res.json(badges);
});

export default router;
