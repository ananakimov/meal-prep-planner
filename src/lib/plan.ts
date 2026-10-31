import { candidates, recipeById } from "./recipes";
import type { LogEntry, Macros, MainSlot, MealKey, Overrides, Profile, Recipe, Schedule, Targets, WeekPlan } from "./types";

/** Rough average for a meal eaten out, used when the user logs nothing */
export const OUT_MEAL: Record<MealKey, Macros> = {
  breakfast: { kcal: 450, protein: 20, fat: 20, carbs: 45 },
  lunch: { kcal: 700, protein: 35, fat: 30, carbs: 70 },
  dinner: { kcal: 750, protein: 35, fat: 35, carbs: 70 },
  snack: { kcal: 250, protein: 8, fat: 12, carbs: 28 },
};

export const ZERO: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

export function add(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, fat: a.fat + b.fat, carbs: a.carbs + b.carbs };
}

export function sum(list: Macros[]): Macros {
  return list.reduce(add, ZERO);
}

const r0 = (n: number) => Math.round(n);

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/**
 * Fit one portion to targetKcal with two levers:
 * 1. the garnish (rice, pasta…) within 50–160% of the base amount;
 * 2. if that is not enough, the whole portion within 70–140% (more or less meat and veg too).
 * The garnish goes first, so protein stays put for most targets.
 */
export function scalePortion(r: Recipe, targetKcal: number): { garnishGrams: number; factor: number; portion: Macros } {
  const g = r.garnish;
  let base: Macros = { ...r.macros };
  let grams = 0;
  if (g) {
    const wanted = g.grams + (targetKcal - r.macros.kcal) / (g.per100.kcal / 100);
    grams = roundTo(clamp(wanted, g.grams * 0.5, g.grams * 1.6), 5);
    const delta = grams - g.grams;
    base = {
      kcal: r.macros.kcal + (delta * g.per100.kcal) / 100,
      protein: r.macros.protein + (delta * g.per100.protein) / 100,
      fat: r.macros.fat + (delta * g.per100.fat) / 100,
      carbs: r.macros.carbs + (delta * g.per100.carbs) / 100,
    };
  }
  const gap = targetKcal - base.kcal;
  const factor = Math.abs(gap) > 40 ? Math.round(clamp(targetKcal / base.kcal, 0.7, 1.4) * 100) / 100 : 1;
  const portion = {
    kcal: r0(base.kcal * factor),
    protein: r0(base.protein * factor),
    fat: r0(base.fat * factor),
    carbs: r0(base.carbs * factor),
  };
  return { garnishGrams: roundTo(grams * factor, 5), factor, portion };
}

/** Days (Monday-first) whose home lunch or dinner a batch cooked on `cookDay` covers: that day and the next */
export function coveredDays(schedule: Schedule, cookDay: number): number[] {
  const homeMain = (d: number) => schedule.days[d].lunch === "home" || schedule.days[d].dinner === "home";
  const next = [...schedule.cookDays].sort((a, b) => a - b).find((d) => d > cookDay) ?? 7;
  const days: number[] = [];
  for (let d = cookDay; d < Math.min(next, cookDay + 2) && d < 7; d++) if (homeMain(d)) days.push(d);
  return days;
}

/** Breakfasts rotate in blocks: the same breakfast for 2 home mornings in a row, then the next one */
export function breakfastBlocks(schedule: Schedule, options: string[], blockSize = 2): (string | null)[] {
  const out: (string | null)[] = Array(7).fill(null);
  if (!options.length) return out;
  let i = 0;
  let inBlock = 0;
  for (let d = 0; d < 7; d++) {
    if (schedule.days[d].breakfast !== "home") continue;
    out[d] = options[i % options.length];
    inBlock++;
    if (inBlock >= blockSize) {
      inBlock = 0;
      i++;
    }
  }
  return out;
}

/** Calories left for one main portion on a typical home day */
export function mainPortionTarget(t: Targets, breakfast: Macros, snack: Macros): number {
  return Math.round((t.kcal - breakfast.kcal - snack.kcal) / 2);
}

export function buildWeek(
  weekStart: string,
  profile: Profile,
  t: Targets,
  schedule: Schedule,
  overrides: Overrides = { breakfasts: {}, mains: {} },
): WeekPlan {
  const bOptions = candidates("breakfast", profile).map((r) => r.id);
  const breakfasts = breakfastBlocks(schedule, bOptions).map((id, d) =>
    id === null ? null : overrides.breakfasts[d] ?? id,
  );
  const snack = candidates("snack", profile)[0] ?? null;
  const avgBreakfast = averageMacros(breakfasts.filter(Boolean).map((id) => recipeById(id)!.macros)) ?? OUT_MEAL.breakfast;
  const target = mainPortionTarget(t, avgBreakfast, snack?.macros ?? ZERO);

  const mainOptions = candidates("main", profile);
  const mains: MainSlot[] = [...schedule.cookDays]
    .sort((a, b) => a - b)
    .map((cookDay, i) => {
      const fallback = mainOptions.length ? mainOptions[i % mainOptions.length].id : null;
      const id = overrides.mains[cookDay] ?? fallback;
      const r = recipeById(id);
      if (!r) return null;
      const days = coveredDays(schedule, cookDay);
      const own = averageMacros(days.map((d) => breakfasts[d]).filter(Boolean).map((b) => recipeById(b)!.macros));
      const { garnishGrams, factor, portion } = scalePortion(r, own ? mainPortionTarget(t, own, snack?.macros ?? ZERO) : target);
      return { cookDay, days, recipeId: r.id, garnishGrams, factor, portion };
    })
    .filter((m): m is MainSlot => m !== null && m.days.length > 0);

  return { weekStart, breakfasts, mains, snackId: snack?.id ?? null };
}

function averageMacros(list: Macros[]): Macros | null {
  if (!list.length) return null;
  const s = sum(list);
  const n = list.length;
  return { kcal: s.kcal / n, protein: s.protein / n, fat: s.fat / n, carbs: s.carbs / n };
}

export function mainForDay(plan: WeekPlan, day: number): MainSlot | undefined {
  return plan.mains.find((m) => m.days.includes(day));
}

export interface PlannedMeal {
  meal: MealKey;
  place: "home" | "out" | "uncovered";
  recipe?: Recipe;
  macros: Macros;
}

/** What the plan puts on each meal of a day; "uncovered" = home meal with no batch cooked for it */
export function plannedDay(plan: WeekPlan, schedule: Schedule, day: number): PlannedMeal[] {
  const s = schedule.days[day];
  const main = mainForDay(plan, day);
  const mainRecipe = recipeById(main?.recipeId);
  const meals: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];
  return meals.map((meal) => {
    if (s[meal] === "out") return { meal, place: "out", macros: OUT_MEAL[meal] };
    if (meal === "breakfast") {
      const r = recipeById(plan.breakfasts[day]);
      return r ? { meal, place: "home", recipe: r, macros: r.macros } : { meal, place: "uncovered", macros: OUT_MEAL[meal] };
    }
    if (meal === "snack") {
      const r = recipeById(plan.snackId);
      return r ? { meal, place: "home", recipe: r, macros: r.macros } : { meal, place: "uncovered", macros: ZERO };
    }
    return mainRecipe && main
      ? { meal, place: "home", recipe: mainRecipe, macros: main.portion }
      : { meal, place: "uncovered", macros: OUT_MEAL[meal] };
  });
}

/** Default logging: the plan counts as eaten; entries replace a meal or add on top */
export function eatenDay(planned: PlannedMeal[], log: LogEntry[]): Macros {
  const replaced = new Set(log.filter((e) => e.mode === "replace").map((e) => e.meal));
  const base = planned.filter((m) => !replaced.has(m.meal)).map((m) => m.macros);
  return sum([...base, ...log.map((e) => e.macros)]);
}
