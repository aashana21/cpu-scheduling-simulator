export type Process = {
  id: string;
  at: number;
  bt: number;
  priority: number;
};

export type AlgoKey = "fcfs" | "sjf" | "rr" | "priority";

export type Slice = { pid: string | null; start: number; end: number };

export type Row = {
  id: string;
  at: number;
  bt: number;
  priority: number;
  ct: number;
  tat: number;
  wt: number;
};

export type QueueItem = { id: string; remaining: number; priority: number; bt: number };

export type Snapshot = {
  time: number;
  queue: QueueItem[];
  running: { id: string; remaining: number; ranFor: number } | null;
  completed: string[];
  slices: Slice[];
  status: "IDLE" | "RUNNING" | "CONTEXT SWITCH" | "COMPLETED";
  log: string[];
};

export type SimResult = {
  algo: AlgoKey;
  snapshots: Snapshot[];
  slices: Slice[];
  rows: Row[];
  awt: number;
  atat: number;
  contextSwitches: number;
  totalTime: number;
};

export const ALGOS: { key: AlgoKey; name: string; short: string; icon: string; blurb: string; detail: string }[] = [
  {
    key: "fcfs",
    name: "First Come First Serve",
    short: "FCFS",
    icon: "⚡",
    blurb: "Processes are executed in the order they arrive.",
    detail: "Non-preemptive. The earliest arriving process runs to completion first. Simple, but long jobs can delay everyone (convoy effect).",
  },
  {
    key: "sjf",
    name: "Shortest Job First",
    short: "SJF",
    icon: "🚀",
    blurb: "The shortest available burst time is picked first.",
    detail: "Non-preemptive. Among processes that have arrived, the one with the smallest burst time is selected. Usually gives the lowest average waiting time.",
  },
  {
    key: "rr",
    name: "Round Robin",
    short: "Round Robin",
    icon: "🔄",
    blurb: "Time-sharing: every process gets one time quantum.",
    detail: "Preemptive by time slice. When the quantum expires the process moves to the back of the ready queue if burst time remains. Fair, but adds context switches.",
  },
  {
    key: "priority",
    name: "Priority Scheduling",
    short: "Priority",
    icon: "🎯",
    blurb: "Highest priority process is picked first (smaller number = higher priority).",
    detail: "Non-preemptive. Among arrived processes, the smallest priority number wins. Ties are broken by arrival time.",
  },
];

function mergeSlices(raw: (string | null)[], startAt = 0): Slice[] {
  const out: Slice[] = [];
  raw.forEach((pid, i) => {
    const t = startAt + i;
    const last = out[out.length - 1];
    if (last && last.pid === pid && last.end === t) last.end = t + 1;
    else out.push({ pid, start: t, end: t + 1 });
  });
  return out;
}

export function simulate(processes: Process[], algo: AlgoKey, quantum = 2): SimResult {
  const procs = processes.map((p) => ({ ...p }));
  const remaining = new Map(procs.map((p) => [p.id, p.bt]));
  const ct = new Map<string, number>();
  const notArrived = [...procs].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  let queue: QueueItem[] = [];
  let running: { id: string; remaining: number; ranFor: number } | null = null;
  let quantumUsed = 0;
  const completed: string[] = [];
  const timeline: (string | null)[] = [];
  const snapshots: Snapshot[] = [];
  let contextSwitches = 0;
  let t = 0;
  let guard = 0;
  const maxT = procs.reduce((s, p) => s + p.bt, 0) + Math.max(...procs.map((p) => p.at)) + 5;

  const toItem = (p: Process): QueueItem => ({
    id: p.id,
    remaining: remaining.get(p.id) ?? p.bt,
    priority: p.priority,
    bt: p.bt,
  });

  while (completed.length < procs.length && guard++ < maxT * 4 + 50) {
    const log: string[] = [];

    // arrivals
    while (notArrived.length && notArrived[0]!.at <= t) {
      const p = notArrived.shift()!;
      queue.push(toItem(p));
      log.push(`t=${t}: ${p.id} arrived (BT=${p.bt}, Priority=${p.priority}) → Ready Queue.`);
    }

    // round robin quantum expiry
    if (running && algo === "rr" && quantumUsed >= quantum) {
      queue.push({
        id: running.id,
        remaining: running.remaining,
        priority: procs.find((p) => p.id === running!.id)!.priority,
        bt: procs.find((p) => p.id === running!.id)!.bt,
      });
      log.push(`t=${t}: ${running.id} → TIME QUANTUM EXPIRED, moved to back of Ready Queue (remaining ${running.remaining}).`);
      running = null;
      quantumUsed = 0;
      contextSwitches++;
    }

    // dispatch
    if (!running && queue.length) {
      let idx = 0;
      if (algo === "sjf") {
        queue.forEach((q, i) => {
          if (q.remaining < queue[idx]!.remaining) idx = i;
        });
        log.push(`t=${t}: SJF picks ${queue[idx]!.id} — shortest burst time (${queue[idx]!.remaining}).`);
      } else if (algo === "priority") {
        queue.forEach((q, i) => {
          if (q.priority < queue[idx]!.priority) idx = i;
        });
        log.push(`t=${t}: Priority picks ${queue[idx]!.id} — highest priority (${queue[idx]!.priority}).`);
      } else {
        log.push(`t=${t}: ${queue[0]!.id} dispatched from the front of the Ready Queue.`);
      }
      const chosen = queue.splice(idx, 1)[0]!;
      running = { id: chosen.id, remaining: chosen.remaining, ranFor: 0 };
      quantumUsed = 0;
    }

    if (!running) {
      log.push(`t=${t}: CPU IDLE — no process has arrived yet.`);
    }

    snapshots.push({
      time: t,
      queue: queue.map((q) => ({ ...q })),
      running: running ? { ...running } : null,
      completed: [...completed],
      slices: mergeSlices(timeline),
      status: running ? "RUNNING" : "IDLE",
      log,
    });

    // execute one time unit
    if (running) {
      timeline.push(running.id);
      running.remaining -= 1;
      running.ranFor += 1;
      quantumUsed += 1;
      remaining.set(running.id, running.remaining);
      if (running.remaining === 0) {
        ct.set(running.id, t + 1);
        completed.push(running.id);
        snapshots[snapshots.length - 1]!.log.push(`t=${t + 1}: ${running.id} → COMPLETED.`);
        running = null;
        quantumUsed = 0;
      }
    } else {
      timeline.push(null);
    }
    t += 1;
  }

  const rows: Row[] = procs.map((p) => {
    const c = ct.get(p.id) ?? 0;
    const tat = c - p.at;
    return { id: p.id, at: p.at, bt: p.bt, priority: p.priority, ct: c, tat, wt: tat - p.bt };
  });
  const awt = rows.reduce((s, r) => s + r.wt, 0) / rows.length;
  const atat = rows.reduce((s, r) => s + r.tat, 0) / rows.length;

  snapshots.push({
    time: t,
    queue: [],
    running: null,
    completed: [...completed],
    slices: mergeSlices(timeline),
    status: "COMPLETED",
    log: [`t=${t}: All processes completed. AWT = ${awt.toFixed(2)}, ATAT = ${atat.toFixed(2)}.`],
  });

  return {
    algo,
    snapshots,
    slices: mergeSlices(timeline),
    rows,
    awt,
    atat,
    contextSwitches,
    totalTime: t,
  };
}

export function simulateAll(processes: Process[], quantum: number): Record<AlgoKey, SimResult> {
  return {
    fcfs: simulate(processes, "fcfs", quantum),
    sjf: simulate(processes, "sjf", quantum),
    rr: simulate(processes, "rr", quantum),
    priority: simulate(processes, "priority", quantum),
  };
}

export type Ranking = {
  order: { key: AlgoKey; awt: number; atat: number }[];
  winners: AlgoKey[];
  explanation: string;
};

export function rank(results: Record<AlgoKey, SimResult>): Ranking {
  const order = (Object.keys(results) as AlgoKey[])
    .map((key) => ({ key, awt: results[key].awt, atat: results[key].atat }))
    .sort((a, b) => a.awt - b.awt || a.atat - b.atat);

  const best = order[0]!;
  const winners = order.filter((o) => Math.abs(o.awt - best.awt) < 1e-9).map((o) => o.key);
  const nameOf = (k: AlgoKey) => ALGOS.find((a) => a.key === k)!.short;

  let explanation: string;
  if (winners.length > 1) {
    explanation = `Tie detected between ${winners.map(nameOf).join(" and ")}. They finished with an identical Average Waiting Time of ${best.awt.toFixed(2)}, which means the CPU spent the same total amount of time keeping processes waiting under both policies for this dataset — with these arrival and burst times, both algorithms happen to dispatch the processes in an equivalent order.`;
  } else {
    const lowestTat = [...order].sort((a, b) => a.atat - b.atat)[0]!.key === best.key;
    explanation = `${nameOf(best.key)} is the champion because it achieved the lowest Average Waiting Time (${best.awt.toFixed(2)}) among the four algorithms${
      lowestTat ? ` and also the lowest Average Turnaround Time (${best.atat.toFixed(2)})` : `, with an Average Turnaround Time of ${best.atat.toFixed(2)}`
    }. Compared with the runner-up ${nameOf(order[1]!.key)} (AWT ${order[1]!.awt.toFixed(2)}), it kept processes waiting ${(order[1]!.awt - best.awt).toFixed(2)} time units less on average.`;
  }

  return { order, winners, explanation };
}
