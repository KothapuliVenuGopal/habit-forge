import { useState } from "react";
import { MoreVertical, Pencil, Archive, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type HabitCategory } from "@/lib/constants";

export type Habit = {
  id: string;
  name: string;
  category: HabitCategory;
  description: string | null;
  icon: string | null;
};

export function HabitCard({
  habit,
  todayStatus,
  onCheckIn,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  todayStatus?: "verified" | "pending" | "rejected";
  onCheckIn: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cat = CATEGORIES[habit.category];
  const isDone = todayStatus === "verified";

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: cat.gradient }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
            style={{ background: cat.gradient, color: "white" }}
          >
            {habit.icon || cat.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground">{habit.name}</h3>
              {isDone && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {cat.label}
            </p>
            {habit.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{habit.description}</p>
            ) : null}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100"
              aria-label="Habit actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4" /> Edit habit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Sparkles className="h-4 w-4" /> Change category
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete()}>
              <Archive className="h-4 w-4" /> Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete habit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {todayStatus === "verified" && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
              Verified today
            </span>
          )}
          {todayStatus === "pending" && (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 font-medium text-warning">
              Pending
            </span>
          )}
          {todayStatus === "rejected" && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive">
              Rejected — retry
            </span>
          )}
          {!todayStatus && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
              Not checked in
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={onCheckIn}
          disabled={isDone}
          variant={isDone ? "outline" : "default"}
          className={isDone ? "" : "bg-gradient-brand text-white hover:opacity-90"}
        >
          {isDone ? "Done" : "Check in"}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this habit? This action cannot be undone. All related
              check-ins and streak data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmOpen(false);
                onDelete();
              }}
            >
              Delete habit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
