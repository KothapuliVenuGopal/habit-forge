export type HabitCategory =
  | "coding"
  | "reading"
  | "gym"
  | "running"
  | "meditation"
  | "fasting"
  | "custom";

export const CATEGORIES: Record<
  HabitCategory,
  { label: string; icon: string; color: string; gradient: string; tint: string; verifyPrompt: string }
> = {
  coding: {
    label: "Coding",
    icon: "💻",
    color: "oklch(0.535 0.22 277)",
    gradient: "linear-gradient(135deg, #4F46E5, #06B6D4)",
    tint: "bg-indigo-50",
    verifyPrompt:
      "User claims to have coded today. Evaluate their submission for technical depth and authenticity. Probe with one specific technical question about what they built.",
  },
  reading: {
    label: "Reading",
    icon: "📚",
    color: "oklch(0.62 0.22 296)",
    gradient: "linear-gradient(135deg, #8B5CF6, #4F46E5)",
    tint: "bg-purple-50",
    verifyPrompt:
      "User claims to have read today. Evaluate the depth and authenticity of their summary. Generate one comprehension question they should be able to answer.",
  },
  gym: {
    label: "Gym",
    icon: "🏋️",
    color: "oklch(0.66 0.24 25)",
    gradient: "linear-gradient(135deg, #EF4444, #F59E0B)",
    tint: "bg-red-50",
    verifyPrompt:
      "User claims to have worked out. Evaluate the credibility of the exercise list and duration. Flag anything unrealistic.",
  },
  running: {
    label: "Running",
    icon: "🏃",
    color: "oklch(0.72 0.14 215)",
    gradient: "linear-gradient(135deg, #06B6D4, #22C55E)",
    tint: "bg-cyan-50",
    verifyPrompt:
      "User claims to have run today. Evaluate pace/distance/duration consistency. Flag impossible pace.",
  },
  meditation: {
    label: "Meditation",
    icon: "🧘",
    color: "oklch(0.62 0.22 296)",
    gradient: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
    tint: "bg-violet-50",
    verifyPrompt:
      "User claims to have meditated. Evaluate the depth and presence in their reflection notes.",
  },
  fasting: {
    label: "Fasting",
    icon: "⏱️",
    color: "oklch(0.79 0.17 70)",
    gradient: "linear-gradient(135deg, #F59E0B, #EF4444)",
    tint: "bg-amber-50",
    verifyPrompt:
      "User claims to have fasted. Evaluate window length and notes for plausibility.",
  },
  custom: {
    label: "Custom",
    icon: "✨",
    color: "oklch(0.55 0.04 256)",
    gradient: "linear-gradient(135deg, #64748B, #4F46E5)",
    tint: "bg-slate-50",
    verifyPrompt:
      "User defined a custom habit. Evaluate the authenticity of their effort notes.",
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as HabitCategory[];

export type ShieldTier = "bronze" | "silver" | "gold";

export const SHIELDS: Record<
  ShieldTier,
  { label: string; cost: number; protects: number; validity: number; color: string; gradient: string }
> = {
  bronze: {
    label: "Bronze Shield",
    cost: 100,
    protects: 1,
    validity: 7,
    color: "#A16207",
    gradient: "linear-gradient(135deg, #D97706, #92400E)",
  },
  silver: {
    label: "Silver Shield",
    cost: 300,
    protects: 2,
    validity: 14,
    color: "#94A3B8",
    gradient: "linear-gradient(135deg, #CBD5E1, #64748B)",
  },
  gold: {
    label: "Gold Shield",
    cost: 700,
    protects: 5,
    validity: 30,
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #FCD34D, #D97706)",
  },
};

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export const BADGE_CATALOG: Record<
  string,
  { name: string; description: string; rarity: BadgeRarity; icon: string; threshold?: number }
> = {
  streak_7: {
    name: "Week Warrior",
    description: "Complete a 7-day verified streak",
    rarity: "common",
    icon: "🔥",
    threshold: 7,
  },
  streak_30: {
    name: "Monthly Master",
    description: "Complete a 30-day verified streak",
    rarity: "rare",
    icon: "⚡",
    threshold: 30,
  },
  streak_100: {
    name: "Centurion",
    description: "Complete a 100-day verified streak",
    rarity: "epic",
    icon: "💎",
    threshold: 100,
  },
  streak_365: {
    name: "Year of Discipline",
    description: "Complete a 365-day verified streak",
    rarity: "legendary",
    icon: "👑",
    threshold: 365,
  },
};

export const BADGE_KEYS = Object.keys(BADGE_CATALOG);

export const RARITY_STYLE: Record<BadgeRarity, { ring: string; glow: string; label: string }> = {
  common: { ring: "ring-success/40", glow: "shadow-[0_0_24px_-4px_oklch(0.72_0.18_145/0.5)]", label: "Common" },
  rare: { ring: "ring-secondary/50", glow: "shadow-[0_0_24px_-4px_oklch(0.72_0.14_215/0.6)]", label: "Rare" },
  epic: { ring: "ring-highlight/60", glow: "shadow-[0_0_28px_-4px_oklch(0.62_0.22_296/0.7)]", label: "Epic" },
  legendary: {
    ring: "ring-warning/70",
    glow: "shadow-[0_0_36px_-4px_oklch(0.79_0.17_70/0.8)]",
    label: "Legendary",
  },
};
