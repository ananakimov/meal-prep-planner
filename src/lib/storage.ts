import type { LogEntry, Overrides, Profile, Schedule, WeightEntry } from "./types";

export interface AppState {
  version: 1;
  profile: Profile | null;
  schedule: Schedule;
  /** swaps per week (key = Monday date) */
  overrides: Record<string, Overrides>;
  /** default logging: only what differs from the plan, per date */
  log: Record<string, LogEntry[]>;
  weights: WeightEntry[];
  /** shopping checkboxes per week */
  shop: Record<string, Record<string, boolean>>;
  apiKey: string;
}

const KEY = "meal-prep-planner.v1";

const H = { breakfast: "home", lunch: "home", dinner: "home", snack: "home" } as const;
const OUT = { breakfast: "home", lunch: "out", dinner: "out", snack: "home" } as const;

export const DEFAULT_SCHEDULE: Schedule = {
  days: [{ ...H }, { ...H }, { ...H }, { ...H }, { ...H }, { ...OUT }, { ...OUT }],
  cookDays: [0, 3],
};

export const EMPTY: AppState = {
  version: 1,
  profile: null,
  schedule: DEFAULT_SCHEDULE,
  overrides: {},
  log: {},
  weights: [],
  shop: {},
  apiKey: "",
};

export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AppState;
    return parsed.version === 1 ? { ...EMPTY, ...parsed } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function save(s: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // private mode or quota: the app keeps working in memory
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Export without the API key: the file may be shared */
export function exportJson(s: AppState): string {
  return JSON.stringify({ ...s, apiKey: "" }, null, 2);
}

export function importJson(text: string): AppState {
  const parsed = JSON.parse(text) as AppState;
  if (parsed.version !== 1) throw new Error("Неизвестный формат файла");
  return { ...EMPTY, ...parsed };
}
