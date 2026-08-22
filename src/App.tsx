import { useMemo, useState } from "react";
import { ProcessSetup } from "@/components/arena/ProcessSetup";
import { AlgoArena } from "@/components/arena/AlgoArena";
import { Championship } from "@/components/arena/Championship";
import { Button } from "@/components/ui/button";
import { ALGOS, simulateAll, type AlgoKey, type Process } from "@/lib/scheduling";
import { algoColor } from "@/components/arena/shared";
import { ArrowLeft } from "lucide-react";

export default function App() {
  const [config, setConfig] = useState<{ processes: Process[]; quantum: number } | null>(null);
  const [tab, setTab] = useState<AlgoKey>("fcfs");

  const results = useMemo(
    () => (config ? simulateAll(config.processes, config.quantum) : null),
    [config],
  );
  const ids = config?.processes.map((p) => p.id) ?? [];

  return (
    <main className="grid-lines min-h-screen px-4 py-10 sm:px-8">
      {!config || !results ? (
        <ProcessSetup onStart={(processes, quantum) => setConfig({ processes, quantum })} />
      ) : (
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">
              CPU Scheduling <span className="text-primary">Arena</span>
            </h1>
            <Button variant="ghost" onClick={() => setConfig(null)}>
              <ArrowLeft className="size-4" /> Reset &amp; edit processes
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALGOS.map((a) => (
              <button
                key={a.key}
                onClick={() => setTab(a.key)}
                className="rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: tab === a.key ? algoColor[a.key] : "var(--border)",
                  color: tab === a.key ? algoColor[a.key] : "var(--muted-foreground)",
                  backgroundColor:
                    tab === a.key
                      ? `color-mix(in oklab, ${algoColor[a.key]} 14%, transparent)`
                      : "transparent",
                }}
              >
                {a.icon} {a.short}
              </button>
            ))}
          </div>

          <AlgoArena key={tab} algo={tab} result={results[tab]} ids={ids} quantum={config.quantum} />

          <Championship results={results} onReset={() => setConfig(null)} />
        </div>
      )}
    </main>
  );
}
