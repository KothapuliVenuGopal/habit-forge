import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type HabitCategory } from "@/lib/constants";
import { submitCheckIn } from "@/lib/checkins.functions";
import { type Habit } from "./habit-card";

const EXTRA_FIELDS: Record<HabitCategory, { key: string; label: string; placeholder: string }[]> = {
  coding: [
    { key: "github_url", label: "GitHub URL (optional)", placeholder: "https://github.com/..." },
    { key: "what_built", label: "What did you build?", placeholder: "Implemented X using Y..." },
  ],
  reading: [
    { key: "book", label: "Book / topic", placeholder: "Atomic Habits — Chapter 4" },
    { key: "pages", label: "Pages read", placeholder: "20" },
  ],
  gym: [
    { key: "exercises", label: "Exercises", placeholder: "Squats 4x8, Bench 4x6..." },
    { key: "duration", label: "Duration (min)", placeholder: "60" },
  ],
  running: [
    { key: "distance", label: "Distance (km)", placeholder: "5.2" },
    { key: "duration", label: "Duration (min)", placeholder: "28" },
  ],
  meditation: [{ key: "duration", label: "Duration (min)", placeholder: "15" }],
  fasting: [
    { key: "start", label: "Start time", placeholder: "20:00" },
    { key: "end", label: "End time", placeholder: "12:00 next day" },
  ],
  custom: [],
};

export function CheckInDialog({
  habit,
  open,
  onOpenChange,
}: {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [result, setResult] = useState<null | {
    score: number;
    passed: boolean;
    feedback: string;
    follow_up_question?: string;
  }>(null);
  const qc = useQueryClient();
  const submitFn = useServerFn(submitCheckIn);

  const reset = () => {
    setSummary("");
    setDetails({});
    setResult(null);
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!habit) throw new Error("No habit");
      return submitFn({
        data: {
          habit_id: habit.id,
          category: habit.category,
          proof: { summary: summary.trim() || undefined, details },
        },
      });
    },
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["checkins"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
      qc.invalidateQueries({ queryKey: ["badges"] });
      if (r.passed) toast.success(`Verified! +${10 + (r.score >= 90 ? 5 : 0)} credits`);
      else toast.error("Verification failed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!habit) return null;
  const cat = CATEGORIES[habit.category];
  const fields = EXTRA_FIELDS[habit.category];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{habit.icon || cat.icon}</span>
            Check in: {habit.name}
          </DialogTitle>
          <DialogDescription>
            Give specifics. AI will verify and award credits if your effort is genuine.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div
            className={`rounded-xl border p-5 ${
              result.passed
                ? "border-success/30 bg-success/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive" />
              )}
              <h3 className="text-lg font-semibold">
                {result.passed ? "Verified!" : "Not verified"}
              </h3>
              <span className="ml-auto text-sm font-medium">Score: {result.score}/100</span>
            </div>
            <p className="mt-3 text-sm text-foreground">{result.feedback}</p>
            {result.follow_up_question && (
              <p className="mt-3 rounded-md bg-background/60 p-3 text-sm italic text-muted-foreground">
                Follow-up: {result.follow_up_question}
              </p>
            )}
            <DialogFooter className="mt-4">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
          >
            {fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  value={details[f.key] ?? ""}
                  onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  maxLength={200}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="summary">Your reflection / details</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What you actually did, learned, or noticed today…"
                rows={5}
                maxLength={2000}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mut.isPending}
                className="bg-gradient-brand text-white hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                {mut.isPending ? "Verifying…" : "Submit for AI verification"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
