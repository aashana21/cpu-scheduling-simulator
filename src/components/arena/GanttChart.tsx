import type { Slice } from "@/lib/scheduling";
import { processColor } from "./shared";

export function GanttChart({
  slices,
  ids,
  totalTime,
}: {
  slices: Slice[];
  ids: string[];
  totalTime: number;
}) {
  const end = Math.max(totalTime, slices[slices.length - 1]?.end ?? 1, 1);

  return (
    <div className="space-y-2">
      <div className="flex h-14 w-full overflow-hidden rounded-lg border border-border bg-surface-2/60">
        {slices.length === 0 && (
          <div className="flex w-full items-center justify-center text-xs text-muted-foreground">
            Gantt chart builds as the simulation runs…
          </div>
        )}
        {slices.map((s, i) => {
          const width = ((s.end - s.start) / end) * 100;
          const color = s.pid ? processColor(ids, s.pid) : "var(--muted)";
          return (
            <div
              key={`${s.pid}-${s.start}-${i}`}
              style={{
                width: `${width}%`,
                backgroundColor: s.pid ? `color-mix(in oklab, ${color} 30%, transparent)` : "transparent",
                borderColor: color,
                color,
              }}
              className="animate-scale-in flex min-w-0 items-center justify-center border-r border-l-0 text-xs font-semibold font-mono last:border-r-0"
              title={`${s.pid ?? "IDLE"}: ${s.start} → ${s.end}`}
            >
              <span className="truncate px-1">{s.pid ?? "idle"}</span>
            </div>
          );
        })}
      </div>
      <div className="relative h-4">
        {slices.map((s, i) => (
          <span
            key={`m-${i}`}
            className="absolute -translate-x-1/2 text-[10px] font-mono text-muted-foreground"
            style={{ left: `${(s.start / end) * 100}%` }}
          >
            {s.start}
          </span>
        ))}
        {slices.length > 0 && (
          <span
            className="absolute -translate-x-1/2 text-[10px] font-mono text-muted-foreground"
            style={{ left: "100%" }}
          >
            {slices[slices.length - 1]!.end}
          </span>
        )}
      </div>
    </div>
  );
}
