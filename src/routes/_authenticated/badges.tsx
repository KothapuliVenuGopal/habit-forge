import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { myBadges, myProfile } from "@/lib/profile.functions";
import { BADGE_CATALOG, BADGE_KEYS, RARITY_STYLE } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/badges")({
  head: () => ({ meta: [{ title: "Badges — ConsiTrack" }] }),
  component: BadgesPage,
});

function BadgesPage() {
  const badgesFn = useServerFn(myBadges);
  const profileFn = useServerFn(myProfile);
  const badgesQ = useQuery({ queryKey: ["badges"], queryFn: () => badgesFn() });
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const earned = new Map((badgesQ.data ?? []).map((b) => [b.badge_key, b.earned_at]));
  const currentStreak = profileQ.data?.longest_streak ?? 0;

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="mt-2 text-muted-foreground">
          {earned.size} of {BADGE_KEYS.length} unlocked
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BADGE_KEYS.map((key) => {
          const b = BADGE_CATALOG[key];
          const isEarned = earned.has(key);
          const earnedAt = earned.get(key);
          const rarity = RARITY_STYLE[b.rarity];
          const progress = b.threshold
            ? Math.min(100, Math.round((currentStreak / b.threshold) * 100))
            : 0;

          return (
            <div
              key={key}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 text-center shadow-card transition-all hover:-translate-y-1 ${
                isEarned ? `ring-2 ${rarity.ring} ${rarity.glow}` : "opacity-60"
              }`}
            >
              <div
                className={`mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl text-5xl ${
                  isEarned ? "bg-gradient-brand" : "bg-muted grayscale"
                }`}
              >
                {isEarned ? b.icon : <Lock className="h-8 w-8 text-muted-foreground" />}
              </div>
              <h3 className="text-base font-bold">{b.name}</h3>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  b.rarity === "legendary"
                    ? "bg-warning/15 text-warning"
                    : b.rarity === "epic"
                      ? "bg-highlight/15 text-highlight"
                      : b.rarity === "rare"
                        ? "bg-secondary/15 text-secondary"
                        : "bg-success/15 text-success"
                }`}
              >
                {rarity.label}
              </span>
              <p className="mt-2 text-xs text-muted-foreground">{b.description}</p>
              {isEarned ? (
                <p className="mt-3 text-xs font-medium text-success">
                  Earned{" "}
                  {earnedAt
                    ? new Date(earnedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </p>
              ) : (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-brand transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {currentStreak}/{b.threshold} days
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
