import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Shield as ShieldIcon, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { myShields, myCredits, buyShield } from "@/lib/shields.functions";
import { SHIELDS, CATEGORIES, CATEGORY_KEYS, type ShieldTier, type HabitCategory } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/shields")({
  head: () => ({ meta: [{ title: "Shields — ConsiTrack" }] }),
  component: ShieldsPage,
});

function ShieldsPage() {
  const qc = useQueryClient();
  const shieldsFn = useServerFn(myShields);
  const creditsFn = useServerFn(myCredits);
  const buyFn = useServerFn(buyShield);
  const shieldsQ = useQuery({ queryKey: ["shields"], queryFn: () => shieldsFn() });
  const creditsQ = useQuery({ queryKey: ["credits"], queryFn: () => creditsFn() });

  const [category, setCategory] = useState<HabitCategory>("coding");

  const buyMut = useMutation({
    mutationFn: (tier: ShieldTier) => buyFn({ data: { tier, category } }),
    onSuccess: () => {
      toast.success("Shield activated!");
      qc.invalidateQueries({ queryKey: ["shields"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const credits = creditsQ.data ?? [];
  const catCredit = credits.find((c) => c.category === category)?.balance ?? 0;
  const active = (shieldsQ.data ?? []).filter((s) => s.status === "active");

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shield Marketplace</h1>
        <p className="mt-2 text-muted-foreground">
          Spend category credits to protect your streak when life happens.
        </p>
      </div>

      {/* Category selector */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
        <span className="text-sm font-medium">Buying for:</span>
        <Select value={category} onValueChange={(v) => setCategory(v as HabitCategory)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                <span className="mr-2">{CATEGORIES[k].icon}</span>
                {CATEGORIES[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto rounded-full bg-gradient-brand-soft px-3 py-1 text-sm">
          <span className="text-muted-foreground">{CATEGORIES[category].label} credits:</span>{" "}
          <span className="font-mono font-bold text-primary">{catCredit}</span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {(Object.keys(SHIELDS) as ShieldTier[]).map((tier) => {
          const s = SHIELDS[tier];
          const canAfford = catCredit >= s.cost;
          return (
            <div
              key={tier}
              className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: s.gradient }}
              />
              <div
                className="mb-4 grid h-14 w-14 place-items-center rounded-2xl shadow-glow"
                style={{ background: s.gradient }}
              >
                <ShieldIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold">{s.label}</h3>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>Protects {s.protects} missed day{s.protects > 1 ? "s" : ""}</p>
                <p>Valid for {s.validity} days</p>
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-black">{s.cost}</span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
              <Button
                className="mt-5 w-full bg-gradient-brand text-white hover:opacity-90"
                disabled={!canAfford || buyMut.isPending}
                onClick={() => buyMut.mutate(tier)}
              >
                <Sparkles className="h-4 w-4" />
                {canAfford ? "Purchase" : `Need ${s.cost - catCredit} more`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Your active shields</h2>
        {active.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-10 text-center text-muted-foreground">
            No active shields. Stack some credits and gear up.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((s) => {
              const spec = SHIELDS[s.tier as ShieldTier];
              const expDays = Math.max(
                0,
                Math.ceil(
                  (new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                ),
              );
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-lg"
                      style={{ background: spec.gradient }}
                    >
                      <ShieldIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{spec.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORIES[s.category as HabitCategory].label} • {expDays}d left
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
