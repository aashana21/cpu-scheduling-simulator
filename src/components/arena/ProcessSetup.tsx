import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALGOS, type Process } from "@/lib/scheduling";
import { algoColor } from "./shared";
import { Cpu, Play } from "lucide-react";

type Draft = { id: string; at: string; bt: string; priority: string };

const DEFAULTS: Draft[] = [
  { id: "P1", at: "0", bt: "5", priority: "2" },
  { id: "P2", at: "1", bt: "3", priority: "1" },
  { id: "P3", at: "2", bt: "8", priority: "3" },
  { id: "P4", at: "3", bt: "4", priority: "2" },
];

function blank(i: number): Draft {
  return { id: `P${i + 1}`, at: "", bt: "", priority: "" };
}

export function ProcessSetup({ onStart }: { onStart: (p: Process[], quantum: number) => void }) {
  const [count, setCount] = useState("4");
  const [rows, setRows] = useState<Draft[]>(DEFAULTS);
  const [quantum, setQuantum] = useState("2");
  const [errors, setErrors] = useState<string[]>([]);

  const applyCount = (value: string) => {
    setCount(value);
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1 || n > 10) return;
    setRows((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? blank(i)));
  };

  const update = (i: number, key: keyof Draft, value: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const start = () => {
    const errs: string[] = [];
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 10) errs.push("Number of processes must be a whole number between 1 and 10.");
    const q = Number(quantum);
    if (!Number.isInteger(q) || q < 1) errs.push("Time Quantum must be a whole number of at least 1.");

    const seen = new Set<string>();
    const parsed: Process[] = [];
    rows.forEach((r, i) => {
      const label = `Row ${i + 1}`;
      const id = r.id.trim();
      if (!id) errs.push(`${label}: Process ID is required.`);
      else if (seen.has(id.toUpperCase())) errs.push(`${label}: duplicate Process ID "${id}".`);
      else seen.add(id.toUpperCase());

      const at = Number(r.at);
      const bt = Number(r.bt);
      const pr = Number(r.priority);
      if (r.at === "" || !Number.isFinite(at) || at < 0 || !Number.isInteger(at))
        errs.push(`${label}: Arrival Time must be a whole number ≥ 0.`);
      if (r.bt === "" || !Number.isInteger(bt) || bt <= 0) errs.push(`${label}: Burst Time must be a whole number > 0.`);
      if (r.priority === "" || !Number.isInteger(pr) || pr < 1) errs.push(`${label}: Priority must be a whole number ≥ 1.`);
      parsed.push({ id, at, bt, priority: pr });
    });

    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    onStart(parsed, q);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="animate-fade-in text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-primary">
          <Cpu className="size-3.5" /> Operating Systems Lab
        </div>
        <h1 className="text-4xl font-bold sm:text-6xl">
          CPU Scheduling <span className="text-primary">Arena</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Choose your processes. Start the simulation. Find the winning algorithm — four schedulers compete on the same
          workload and only one becomes champion.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ALGOS.map((a) => (
          <div
            key={a.key}
            className="animate-scale-in rounded-xl border p-4 transition-transform hover:-translate-y-1"
            style={{
              borderColor: `color-mix(in oklab, ${algoColor[a.key]} 45%, transparent)`,
              backgroundColor: `color-mix(in oklab, ${algoColor[a.key]} 8%, transparent)`,
            }}
          >
            <div className="text-2xl">{a.icon}</div>
            <div className="mt-2 font-bold" style={{ color: algoColor[a.key] }}>
              {a.short}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{a.blurb}</p>
          </div>
        ))}
      </div>

      <div className="panel space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="count">Number of Processes (1–10)</Label>
            <Input id="count" inputMode="numeric" value={count} onChange={(e) => applyCount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tq">Time Quantum (Round Robin)</Label>
            <Input id="tq" inputMode="numeric" value={quantum} onChange={(e) => setQuantum(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["Process ID", "Arrival Time", "Burst Time", "Priority"].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="animate-fade-in">
                  <td className="px-2 py-1.5">
                    <Input value={r.id} onChange={(e) => update(i, "id", e.target.value)} className="font-mono" />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input value={r.at} inputMode="numeric" onChange={(e) => update(i, "at", e.target.value)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input value={r.bt} inputMode="numeric" onChange={(e) => update(i, "bt", e.target.value)} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input value={r.priority} inputMode="numeric" onChange={(e) => update(i, "priority", e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Priority rule: <span className="text-warning">smaller priority number = higher priority</span>. All four
          algorithms run on this exact dataset.
        </p>

        {errors.length > 0 && (
          <ul className="animate-fade-in space-y-1 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive">
            {errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        )}

        <Button size="lg" className="w-full" onClick={start}>
          <Play className="size-4" /> START SIMULATION
        </Button>
      </div>
    </div>
  );
}
