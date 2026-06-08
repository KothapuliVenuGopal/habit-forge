import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CATEGORY_KEYS, type HabitCategory } from "@/lib/constants";
import { createHabit, updateHabit } from "@/lib/habits.functions";

export type HabitFormValue = {
  id?: string;
  name: string;
  category: HabitCategory;
  description?: string | null;
  icon?: string | null;
};

export function HabitFormDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: HabitFormValue | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<HabitCategory>(initial?.category ?? "coding");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");

  const qc = useQueryClient();
  const createFn = useServerFn(createHabit);
  const updateFn = useServerFn(updateHabit);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        icon: icon.trim() || null,
      };
      if (initial?.id) return updateFn({ data: { id: initial.id, ...payload } });
      return createFn({ data: payload });
    },
    onSuccess: () => {
      toast.success(initial?.id ? "Habit updated" : "Habit created");
      qc.invalidateQueries({ queryKey: ["habits"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit habit" : "Create a new habit"}</DialogTitle>
          <DialogDescription>
            Make it specific and actionable. AI verifies your check-ins daily.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return toast.error("Name required");
            mut.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Read 20 pages of fiction"
              maxLength={80}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as HabitCategory)}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder={CATEGORIES[category].icon}
                maxLength={4}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
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
              {mut.isPending ? "Saving…" : initial?.id ? "Save changes" : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
