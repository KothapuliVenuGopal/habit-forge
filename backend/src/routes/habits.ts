import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";

const router = Router();
router.use(requireAuth);

const Categories = z.enum(["coding", "reading", "gym", "running", "meditation", "fasting", "custom"]);

const HabitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: Categories,
  description: z.string().trim().max(500).optional().nullable(),
  icon: z.string().trim().max(8).optional().nullable(),
});

router.get("/", async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.sub, archived: false },
    orderBy: { createdAt: "asc" },
  });
  res.json(habits);
});

router.post("/", validateBody(HabitSchema), async (req, res) => {
  const habit = await prisma.habit.create({
    data: { ...req.body, userId: req.user!.sub },
  });
  res.status(201).json(habit);
});

router.patch("/:id", validateBody(HabitSchema.partial()), async (req, res) => {
  const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
  if (!habit || habit.userId !== req.user!.sub) throw new HttpError(404, "Habit not found");
  const updated = await prisma.habit.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
  if (!habit || habit.userId !== req.user!.sub) throw new HttpError(404, "Habit not found");
  await prisma.habit.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.post(
  "/:id/archive",
  validateBody(z.object({ archived: z.boolean() })),
  async (req, res) => {
    const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!habit || habit.userId !== req.user!.sub) throw new HttpError(404, "Habit not found");
    const updated = await prisma.habit.update({
      where: { id: req.params.id },
      data: { archived: req.body.archived },
    });
    res.json(updated);
  },
);

export default router;
