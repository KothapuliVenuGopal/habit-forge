import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Trophy, Target, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { myProfile, myBadges } from "@/lib/profile.functions";
import { myCredits } from "@/lib/shields.functions";
import { CATEGORIES, BADGE_CATALOG, type HabitCategory } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — ConsiTrack" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const pFn = useServerFn(myProfile);
  const bFn = useServerFn(myBadges);
  const cFn = useServerFn(myCredits);
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => pFn() });
  const badgesQ = useQuery({ queryKey: ["badges"], queryFn: () => bFn() });
  const creditsQ = useQuery({ queryKey: ["credits"], queryFn: () => cFn() });

  const p = profileQ.data;
  if (!p) return <AppShell><p className="text-muted-foreground">Loading…</p></AppShell>;
  const initials = (p.display_name || p.username || "?").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-8 text-white shadow-elevated">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(60% 50% at 80% 0%, white, transparent 70%)" }}
        />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-end">
          <Avatar className="h-24 w-24 ring-4 ring-white/30">
            <AvatarImage src={p.avatar_url ?? undefined} />
            <AvatarFallback className="bg-white/20 text-2xl font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-black">{p.display_name ?? p.username}</h1>
            <p className="text-white/80">@{p.username}</p>
            {p.bio && <p className="mt-2 max-w-xl text-sm text-white/90">{p.bio}</p>}
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-white/80">Level</p>
            <p className="text-3xl font-black">{p.level}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Flame} label="Current streak" value={`${p.current_streak}d`} grad="bg-gradient-fire" />
        <Stat icon={Trophy} label="Longest streak" value={`${p.longest_streak}d`} grad="bg-gradient-warning" />
        <Stat icon={Target} label="Consistency" value={`${p.consistency_score}/100`} grad="bg-gradient-brand" />
        <Stat icon={Zap} label="XP" value={`${p.xp}`} grad="bg-gradient-success" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Bond Credits</h2>
          {(creditsQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Earn credits by getting verified check-ins.</p>
          ) : (
            <div className="space-y-3">
              {(creditsQ.data ?? []).map((c) => {
                const cat = CATEGORIES[c.category as HabitCategory];
                return (
                  <div key={c.category} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span> {cat.label}
                    </span>
                    <span className="font-mono font-bold text-primary">{c.balance}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Recent badges</h2>
          {(badgesQ.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No badges yet — your first streak is waiting.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(badgesQ.data ?? []).map((b) => {
                const meta = BADGE_CATALOG[b.badge_key];
                if (!meta) return null;
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 rounded-full bg-gradient-brand-soft px-3 py-1.5 text-sm font-medium"
                  >
                    <span className="text-lg">{meta.icon}</span>
                    {meta.name}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  grad,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  grad: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${grad}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
