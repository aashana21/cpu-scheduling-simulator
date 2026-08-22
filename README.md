# CPU Scheduling Arena — Interactive OS Simulator

An interactive simulator that compares four CPU scheduling algorithms:

- **FCFS** — First Come First Serve
- **SJF** — Shortest Job First (non-preemptive)
- **RR** — Round Robin (configurable time quantum)
- **Priority** — Priority Scheduling (non-preemptive, lower number = higher priority)

Features: process input with validation, animated Ready Queue → CPU → Completed
transitions, per-algorithm Gantt charts (with RR time slices), CT/TAT/WT tables,
AWT/ATAT comparison dashboard and a dynamic "Champion" (lowest average waiting time).

## Run it locally in VS Code

Requirements: **Node.js 20 or newer** (https://nodejs.org).

```bash
# 1. open this folder in VS Code
# 2. install dependencies
npm install

# 3. start the dev server
npm run dev
```

Then open the printed URL (http://localhost:5173).

Production build:

```bash
npm run build     # output in dist/
npm run preview   # serve the built app
```

## Project structure

```
index.html                      Page shell + Google Fonts (Space Grotesk, DM Sans)
src/main.tsx                    React entry point
src/App.tsx                     Screen flow: setup -> arena tabs -> championship
src/styles.css                  Arena design system (colors, animations, utilities)
src/lib/scheduling.ts           Scheduling engine: FCFS, SJF, RR, Priority + metrics
src/lib/utils.ts                className helper
src/components/arena/
  ProcessSetup.tsx              Welcome screen + process/quantum input & validation
  AlgoArena.tsx                 Animated ready queue, CPU, event log, playback controls
  GanttChart.tsx                Gantt chart renderer
  Championship.tsx              Ranking table, AWT/ATAT bar charts, winner explanation
  shared.ts                     Algorithm/process color mapping
src/components/ui/              Minimal Button / Input / Label primitives
```

## How the simulation works

`simulateAll(processes, quantum)` runs each algorithm independently and returns, for
every algorithm: the executed time slices (Gantt data), per-process metrics and a
timeline of snapshots (one per time unit) describing which process is on the CPU,
what is in the ready queue and what has completed. The UI simply steps through those
snapshots, which is what drives the animations and the step/pause/resume controls.

Metrics used:

- Completion Time (CT) — when the process finishes
- Turnaround Time (TAT) = CT − Arrival Time
- Waiting Time (WT) = TAT − Burst Time
- ATAT / AWT — averages across all processes
- Winner = lowest AWT (ties broken by lower ATAT)

## Tech stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + lucide-react icons.
No backend, no database — everything runs in the browser.
