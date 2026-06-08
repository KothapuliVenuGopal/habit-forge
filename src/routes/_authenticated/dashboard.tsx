import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Flame, Trophy, Coins, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HabitCard, type Habit } from "@/components/habit-card";
import { HabitFormDialog, type HabitFormValue } from "@/components/habit-form-dialog";
import { CheckInDialog } from "@/components/check-in-dialog";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { Button } from "@/components/ui/button";
import { listHabits, deleteHabit, archiveHabit } from "@/lib/habits.functions";
import { todaysCheckIns, recentCheckIns } from "@/lib/checkins.functions";
import { myProfile } from "@/lib/profile.functions";
import { myCredits } from "@/lib/shields.functions";
import { CATEGORIES, type HabitCategory } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ConsiTrack" }] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const listFn = useServerFn(listHabits);
  const todayFn = useServerFn(todaysCheckIns);
  const recentFn = useServerFn(recentCheckIns);
  const profileFn = useServerFn(myProfile);
  const creditsFn = useServerFn(myCredits);
  const delFn = useServerFn(deleteHabit);
  const archFn = useServerFn(archiveHabit);

  const habitsQ = useQuery({ queryKey: ["habits"], queryFn: () => listFn() });
  const todayQ = useQuery({ queryKey: ["checkins", "today"], queryFn: () => todayFn() });
  const recentQ = useQuery({ queryKey: ["checkins", "recent"], queryFn: () => recentFn() });
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const creditsQ = useQuery({ queryKey: ["credits"], queryFn: () => creditsFn() });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HabitFormValue | null>(null);
  const [checkInHabit, setCheckInHabit] = useState<Habit | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Habit deleted");
      qc.invalidateQueries({ queryKey: ["habits"] });
      qc.invalidateQueries({ queryKey: ["checkins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const archiveMut = useMutation({
    mutationFn: (id: string) => archFn({ data: { id, archived: true } }),
    onSuccess: () => {
      toast.success("Habit archived");
      qc.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  const today = todayQ.data ?? [];
  const habits = habitsQ.data ?? [];
  const profile = profileQ.data;
  const credits = creditsQ.data ?? [];
  const totalCredits = credits.reduce((s, c) => s + c.balance, 0);
  const verifiedToday = today.filter((c) => c.status === "verified").length;

  const statusByHabit = new Map(today.map((c) => [c.habit_id, c.status]));

  return (
    <AppShell>
      {/* Greeting + stats */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Hey {profile?.display_name?.split(" ")[0] ?? profile?.username ?? "there"} 👋
          </h1>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="bg-gradient-brand text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New habit
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current streak"
          value={profile?.current_streak ?? 0}
          suffix="days"
          icon={Flame}
          gradient="bg-gradient-fire"
        />
        <StatCard
          label="Longest streak"
          value={profile?.longest_streak ?? 0}
          suffix="days"
          icon={Trophy}
          gradient="bg-gradient-warning"
        />
        <StatCard
          label="Consistency"
          value={profile?.consistency_score ?? 0}
          suffix="/100"
          icon={Target}
          gradient="bg-gradient-brand"
        />
        <StatCard
          label="Total credits"
          value={totalCredits}
          suffix=""
          icon={Coins}
          gradient="bg-gradient-success"
        />
      </div>

      {/* Heatmap */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Activity</h2>
            <p className="text-sm text-muted-foreground">Last 120 days of verified check-ins</p>
          </div>
          <span className="text-sm font-medium text-success">
            {verifiedToday > 0 ? `${verifiedToday} verified today ✓` : "Nothing today yet"}
          </span>
        </div>
        <ContributionHeatmap
          days={(recentQ.data ?? []).map((d) => ({
            date: d.check_date as string,
            status: d.status as "verified" | "pending" | "rejected",
          }))}
        />
      </div>

      {/* Credits by category */}
      {credits.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Bond Credits</h2>
          <div className="flex flex-wrap gap-2">
            {credits.map((c) => {
              const cat = CATEGORIES[c.category as HabitCategory];
              return (
                <div
                  key={c.category}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-soft"
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                  <span className="font-mono font-semibold text-primary">{c.balance}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's habits */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Today's habits</h2>
          <span className="text-sm text-muted-foreground">
            {verifiedToday}/{habits.length} done
          </span>
        </div>
        {habitsQ.isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : habits.length === 0 ? (
          <EmptyState onCreate={() => setFormOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {habits.map((h) => (
              <HabitCard
                key={h.id}
                habit={h as Habit}
                todayStatus={statusByHabit.get(h.id) as "verified" | "pending" | "rejected" | undefined}
                onCheckIn={() => setCheckInHabit(h as Habit)}
                onEdit={() => {
                  setEditing({
                    id: h.id,
                    name: h.name,
                    category: h.category as HabitCategory,
                    description: h.description,
                    icon: h.icon,
                  });
                  setFormOpen(true);
                }}
                onDelete={() => deleteMut.mutate(h.id)}
              />
            ))}
          </div>
        )}
      </div>

      <HabitFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        initial={editing}
      />
      <CheckInDialog
        habit={checkInHabit}
        open={!!checkInHabit}
        onOpenChange={(v) => !v && setCheckInHabit(null)}
      />
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: number;
  suffix: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${gradient}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-surface p-12 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
        <Plus className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold">No habits yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first habit and start the streak engine.
      </p>
      <Button onClick={onCreate} className="mt-4 bg-gradient-brand text-white hover:opacity-90">
        Create your first habit
      </Button>
    </div>
  );
}
