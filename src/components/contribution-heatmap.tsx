import { useMemo } from "react";

type Day = { date: string; status?: "verified" | "pending" | "rejected" };

export function ContributionHeatmap({ days }: { days: Day[] }) {
  const map = useMemo(() => new Map(days.map((d) => [d.date, d.status])), [days]);

  // 17 weeks (119 days) ending today
  const cells = useMemo(() => {
    const out: { date: string; status?: string }[] = [];
    const today = new Date();
    for (let i = 16 * 7 + 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, status: map.get(key) });
    }
    return out;
  }, [map]);

  function color(status?: string) {
    if (status === "verified") return "bg-gradient-brand shadow-[0_0_8px_-2px_oklch(0.535_0.22_277/0.6)]";
    if (status === "pending") return "bg-warning/40";
    if (status === "rejected") return "bg-destructive/30";
    return "bg-muted";
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col grid-rows-7 gap-1"
        style={{ gridAutoColumns: "minmax(0, 1fr)" }}
      >
        {cells.map((c) => (
          <div
            key={c.date}
            title={`${c.date}${c.status ? ` — ${c.status}` : ""}`}
            className={`h-3.5 w-3.5 rounded-[3px] transition-transform hover:scale-125 ${color(c.status)}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="h-3 w-3 rounded-[3px] bg-muted" />
        <div className="h-3 w-3 rounded-[3px] bg-primary/30" />
        <div className="h-3 w-3 rounded-[3px] bg-primary/60" />
        <div className="h-3 w-3 rounded-[3px] bg-gradient-brand" />
        <span>More</span>
      </div>
    </div>
  );
}
