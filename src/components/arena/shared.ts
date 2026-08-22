import type { AlgoKey } from "@/lib/scheduling";

export const algoColor: Record<AlgoKey, string> = {
  fcfs: "var(--fcfs)",
  sjf: "var(--sjf)",
  rr: "var(--rr)",
  priority: "var(--prio)",
};

const palette = ["var(--fcfs)", "var(--sjf)", "var(--rr)", "var(--prio)", "var(--success)", "var(--destructive)"];

export function processColor(ids: string[], id: string) {
  const i = ids.indexOf(id);
  return palette[((i < 0 ? 0 : i) % palette.length)] as string;
}
