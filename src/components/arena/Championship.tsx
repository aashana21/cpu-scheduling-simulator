import { Button } from "@/components/ui/button";
import { ALGOS, rank, type AlgoKey, type SimResult } from "@/lib/scheduling";
import { algoColor } from "./shared";
import { Trophy, RefreshCw } from "lucide-react";

const medals = ["🥇", "🥈", "🥉", "4️⃣"];

function Bars({
  title,
  data,
  unit,
}: {
  title: string;
  data: { key: AlgoKey; value: number }[];
  unit: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-4">
      <div className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="space-y-3">
        {data.map((d) => {
          const meta = ALGOS.find((a) => a.key === d.key)!;
          return (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-semibold" style={{ color: algoColor[d.key] }}>
                {meta.icon} {meta.short}
              </span>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-background/60">
                <div
                  className="flex h-full items-center justify-end rounded-md px-2 text-[11px] font-mono transition-all duration-700"
                  style={{
                    width: `${Math.max((d.value / max) * 100, 6)}%`,
                    backgroundColor: `color-mix(in oklab, ${algoColor[d.key]} 40%, transparent)`,
                    border: `1px solid ${algoColor[d.key]}`,
                    color: algoColor[d.key],
                  }}
                >
                  {d.value.toFixed(2)} {unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Championship({
  results,
  onReset,
}: {
  results: Record<AlgoKey, SimResult>;
  onReset: () => void;
}) {
  const { order, winners, explanation } = rank(results);
  const champ = ALGOS.find((a) => a.key === order[0]!.key)!;
  const champColor = algoColor[order[0]!.key];

  return (
    <section className="space-y-6">
      <div className="panel animate-slide-up overflow-hidden">
        <div
          className="px-6 py-8 text-center"
          style={{ background: `radial-gradient(600px 200px at 50% 0%, color-mix(in oklab, ${champColor} 22%, transparent), transparent)` }}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">CPU Scheduling Championship</p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Trophy className="size-10 animate-pop" style={{ color: champColor }} />
            <h2 className="text-4xl font-bold" style={{ color: champColor }}>
              {winners.length > 1 ? winners.map((w) => ALGOS.find((a) => a.key === w)!.short).join(" & ") : champ.short}
            </h2>
            <p className="text-sm text-muted-foreground">
              {winners.length > 1 ? "Tie — shared lowest Average Waiting Time" : "Lowest Average Waiting Time"}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-8 font-mono text-sm">
            <span>
              Average Waiting Time: <strong style={{ color: champColor }}>{order[0]!.awt.toFixed(2)}</strong>
            </span>
            <span>
              Average Turnaround Time: <strong style={{ color: champColor }}>{order[0]!.atat.toFixed(2)}</strong>
            </span>
          </div>
        </div>
        <div className="border-t border-border px-6 py-5">
          <h4 className="mb-2 text-sm font-semibold">Why?</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="mb-4 text-lg font-bold">Leaderboard</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {order.map((o, i) => {
            const meta = ALGOS.find((a) => a.key === o.key)!;
            return (
              <div
                key={o.key}
                className="animate-scale-in rounded-xl border p-4"
                style={{
                  borderColor: i === 0 ? algoColor[o.key] : "var(--border)",
                  backgroundColor: `color-mix(in oklab, ${algoColor[o.key]} ${i === 0 ? 14 : 6}%, transparent)`,
                  animationDelay: `${i * 90}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{medals[i]}</span>
                  <span className="text-xl">{meta.icon}</span>
                </div>
                <div className="mt-2 font-bold" style={{ color: algoColor[o.key] }}>
                  {meta.short}
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  AWT {o.awt.toFixed(2)} · ATAT {o.atat.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Bars title="Average Waiting Time" data={order.map((o) => ({ key: o.key, value: o.awt }))} unit="u" />
        <Bars
          title="Average Turnaround Time"
          data={[...order].sort((a, b) => a.atat - b.atat).map((o) => ({ key: o.key, value: o.atat }))}
          unit="u"
        />
      </div>

      <div className="panel overflow-x-auto p-5">
        <h3 className="mb-4 text-lg font-bold">Comparison Table</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              {["Algorithm", "Avg Waiting Time", "Avg Turnaround Time", "Context Switches", "Rank"].map((h) => (
                <th key={h} className="border-b border-border px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono">
            {order.map((o, i) => {
              const meta = ALGOS.find((a) => a.key === o.key)!;
              const best = winners.includes(o.key);
              return (
                <tr key={o.key} style={best ? { backgroundColor: `color-mix(in oklab, ${algoColor[o.key]} 12%, transparent)` } : undefined}>
                  <td className="border-b border-border/60 px-3 py-2 font-semibold" style={{ color: algoColor[o.key] }}>
                    {meta.icon} {meta.short}
                  </td>
                  <td className="border-b border-border/60 px-3 py-2">{o.awt.toFixed(2)}</td>
                  <td className="border-b border-border/60 px-3 py-2">{o.atat.toFixed(2)}</td>
                  <td className="border-b border-border/60 px-3 py-2">{results[o.key].contextSwitches}</td>
                  <td className="border-b border-border/60 px-3 py-2">{medals[i]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={onReset}>
          <RefreshCw className="size-4" /> Run Simulation Again
        </Button>
      </div>
    </section>
  );
}
