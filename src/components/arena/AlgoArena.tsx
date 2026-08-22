import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ALGOS, type AlgoKey, type SimResult } from "@/lib/scheduling";
import { algoColor, processColor } from "./shared";
import { GanttChart } from "./GanttChart";
import { Play, Pause, RotateCcw, SkipForward, Zap } from "lucide-react";

export function AlgoArena({
  algo,
  result,
  ids,
  quantum,
}: {
  algo: AlgoKey;
  result: SimResult;
  ids: string[];
  quantum: number;
}) {
  const meta = ALGOS.find((a) => a.key === algo)!;
  const color = algoColor[algo];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = result.snapshots.length - 1;
  const snap = result.snapshots[Math.min(step, last)]!;

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [result]);

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, last)), 750);
    return () => clearTimeout(t);
  }, [playing, step, last]);

  const finished = step >= last;
  const btOf = useMemo(
    () => Object.fromEntries(result.rows.map((r) => [r.id, r.bt])),
    [result],
  );

  return (
    <section className="panel animate-fade-in overflow-hidden">
      <header
        className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"
        style={{ background: `linear-gradient(90deg, color-mix(in oklab, ${color} 14%, transparent), transparent)` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <h3 className="text-lg font-bold" style={{ color }}>
              {meta.short}
              {algo === "rr" && <span className="ml-2 text-xs font-mono text-muted-foreground">TQ = {quantum}</span>}
            </h3>
            <p className="text-xs text-muted-foreground">{meta.blurb}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPlaying((p) => !p)} disabled={finished}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? "Pause" : step === 0 ? "Start" : "Resume"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setStep((s) => Math.min(s + 1, last)); }} disabled={finished}>
            <SkipForward className="size-4" /> Next Step
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setStep(last); }} disabled={finished}>
            <Zap className="size-4" /> Run All
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setPlaying(false); setStep(0); }}>
            <RotateCcw className="size-4" /> Restart
          </Button>
        </div>
      </header>

      <div className="space-y-6 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          {/* Ready queue */}
          <div className="rounded-xl border border-border bg-surface-2/50 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>Ready Queue</span>
              <span className="font-mono">t = {snap.time}</span>
            </div>
            <div className="flex min-h-16 flex-wrap items-center gap-2">
              {snap.queue.length === 0 && <span className="text-sm text-muted-foreground">empty</span>}
              {snap.queue.map((q, i) => (
                <div
                  key={`${q.id}-${i}`}
                  className="animate-queue-in rounded-lg border px-3 py-2 text-sm font-semibold font-mono"
                  style={{
                    borderColor: processColor(ids, q.id),
                    color: processColor(ids, q.id),
                    backgroundColor: `color-mix(in oklab, ${processColor(ids, q.id)} 14%, transparent)`,
                  }}
                >
                  {q.id}
                  <span className="ml-2 text-[10px] opacity-70">
                    {algo === "priority" ? `pri ${q.priority}` : `rem ${q.remaining}`}
                  </span>
                </div>
              ))}
            </div>
            {algo === "priority" && (
              <p className="mt-3 text-[11px] text-warning">Rule: smaller priority number = higher priority</p>
            )}
          </div>

          {/* CPU */}
          <div
            className="animate-glow mx-auto w-full max-w-56 rounded-2xl border-2 p-4 text-center"
            style={{
              color: snap.running ? processColor(ids, snap.running.id) : "var(--muted-foreground)",
              borderColor: "currentColor",
              backgroundColor: "color-mix(in oklab, currentColor 10%, transparent)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] opacity-80">CPU</div>
            <div className="mt-2 text-2xl font-bold font-mono">
              {snap.running ? snap.running.id : finished ? "DONE" : "—"}
            </div>
            <div className="text-xs font-semibold">
              {snap.running ? "RUNNING" : finished ? "COMPLETED" : "IDLE"}
            </div>
            {snap.running && (
              <div className="mt-2 space-y-1 text-[11px] font-mono opacity-90">
                <div>Remaining: {snap.running.remaining}</div>
                <div>Ran for: {snap.running.ranFor}</div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(1 - snap.running.remaining / (btOf[snap.running.id] ?? 1)) * 100}%`,
                      backgroundColor: "currentColor",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Completed */}
          <div className="rounded-xl border border-border bg-surface-2/50 p-4">
            <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Completed</div>
            <div className="flex min-h-16 flex-wrap items-center gap-2">
              {snap.completed.length === 0 && <span className="text-sm text-muted-foreground">none yet</span>}
              {snap.completed.map((id) => (
                <div
                  key={id}
                  className="animate-pop rounded-lg border border-success/60 bg-success/15 px-3 py-2 text-sm font-semibold font-mono text-success"
                >
                  {id} ✓
                </div>
              ))}
            </div>
            {algo === "rr" && (
              <p className="mt-3 text-[11px] text-muted-foreground">Context switches: {result.contextSwitches}</p>
            )}
          </div>
        </div>

        {/* Event log */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Step Log</div>
          <ul className="space-y-1 font-mono text-xs">
            {snap.log.length === 0 && <li className="text-muted-foreground">Nothing happened at this tick.</li>}
            {snap.log.map((l, i) => (
              <li key={i} className="animate-fade-in" style={{ color }}>
                › {l}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Gantt Chart</div>
          <GanttChart slices={snap.slices} ids={ids} totalTime={result.totalTime} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["Process", "AT", "BT", "Priority", "CT", "TAT", "WT"].map((h) => (
                  <th key={h} className="border-b border-border px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {result.rows.map((r) => {
                const done = snap.completed.includes(r.id);
                return (
                  <tr key={r.id} className={done ? "" : "opacity-40"}>
                    <td className="border-b border-border/60 px-3 py-2 font-semibold" style={{ color: processColor(ids, r.id) }}>
                      {r.id}
                    </td>
                    <td className="border-b border-border/60 px-3 py-2">{r.at}</td>
                    <td className="border-b border-border/60 px-3 py-2">{r.bt}</td>
                    <td className="border-b border-border/60 px-3 py-2">{r.priority}</td>
                    <td className="border-b border-border/60 px-3 py-2">{done ? r.ct : "-"}</td>
                    <td className="border-b border-border/60 px-3 py-2">{done ? r.tat : "-"}</td>
                    <td className="border-b border-border/60 px-3 py-2">{done ? r.wt : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-6 text-sm">
            <span>
              Average Waiting Time: <strong style={{ color }}>{result.awt.toFixed(2)}</strong>
            </span>
            <span>
              Average Turnaround Time: <strong style={{ color }}>{result.atat.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        <p className="rounded-lg border border-border/60 bg-surface-2/40 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">{meta.name}:</strong> {meta.detail}
        </p>
      </div>
    </section>
  );
}
