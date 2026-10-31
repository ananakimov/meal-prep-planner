import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addDays, dayIndex, monday, today } from "../lib/dates";
import { targets } from "../lib/nutrition";
import { buildWeek } from "../lib/plan";
import { load, save, type AppState } from "../lib/storage";
import type { Targets, WeekPlan } from "../lib/types";

interface Store {
  state: AppState;
  setState: (fn: (s: AppState) => AppState) => void;
  /** Monday of the current week: what "Today" shows */
  weekStart: string;
  targets: Targets | null;
  plan: WeekPlan | null;
  /** The week being planned and shopped for: next week from Saturday on */
  prepStart: string;
  prepPlan: WeekPlan | null;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, set] = useState<AppState>(load);
  useEffect(() => {
    save(state);
  }, [state]);

  const weekStart = monday(today());
  const prepStart = dayIndex(today()) >= 5 ? addDays(weekStart, 7) : weekStart;
  const t = useMemo(() => (state.profile ? targets(state.profile) : null), [state.profile]);
  const build = (start: string) =>
    state.profile && t ? buildWeek(start, state.profile, t, state.schedule, state.overrides[start]) : null;
  const plan = useMemo(() => build(weekStart), [state.profile, state.schedule, state.overrides, t, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps
  const prepPlan = useMemo(() => (prepStart === weekStart ? plan : build(prepStart)), [plan, prepStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<Store>(
    () => ({ state, setState: set, weekStart, targets: t, plan, prepStart, prepPlan }),
    [state, weekStart, t, plan, prepStart, prepPlan],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}
