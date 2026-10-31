import type { Activity, Goal, Profile, Targets } from "./types";

export const ACTIVITY: Record<Activity, { factor: number; label: string; hint: string }> = {
  low: { factor: 1.2, label: "Сидячая", hint: "работа за столом, без тренировок" },
  mid: { factor: 1.375, label: "1–3 тренировки", hint: "в неделю, плюс обычные шаги" },
  high: { factor: 1.55, label: "3–5 тренировок", hint: "в неделю или 10 тыс. шагов каждый день" },
};

export const GOAL: Record<Goal, { shift: number; label: string; hint: string; proteinPerKg: number }> = {
  lose: { shift: -0.15, label: "Похудеть", hint: "дефицит 15%", proteinPerKg: 1.8 },
  recomp: { shift: -0.12, label: "Рекомпозиция", hint: "сбросить жир и набрать мышцы, дефицит 12%", proteinPerKg: 2 },
  gain: { shift: 0.1, label: "Набрать", hint: "профицит 10%", proteinPerKg: 2 },
};

/** Mifflin–St Jeor */
export function bmr(p: Pick<Profile, "sex" | "weight" | "height" | "age">): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return base + (p.sex === "male" ? 5 : -161);
}

const round = (n: number, step = 1) => Math.round(n / step) * step;

export function targets(p: Profile): Targets {
  const b = bmr(p);
  const activityFactor = ACTIVITY[p.activity].factor;
  const tdee = b * activityFactor;
  const goalShift = GOAL[p.goal].shift;
  const kcal = round(tdee * (1 + goalShift), 10);
  const proteinPerKg = GOAL[p.goal].proteinPerKg;
  const fatPerKg = 0.85;
  const protein = round(p.weight * proteinPerKg, 5);
  const fat = round(p.weight * fatPerKg, 5);
  const carbs = Math.max(0, round((kcal - protein * 4 - fat * 9) / 4, 5));
  return {
    kcal,
    protein,
    fat,
    carbs,
    fiber: 30,
    bmr: round(b),
    tdee: round(tdee),
    activityFactor,
    goalShift,
    proteinPerKg,
    fatPerKg,
  };
}

/** Plain-language explanation of each step, shown after onboarding */
export function explain(p: Profile, t: Targets): string[] {
  const sexTerm = p.sex === "male" ? "+ 5" : "− 161";
  const pct = Math.round(Math.abs(t.goalShift) * 100);
  return [
    `Базовый обмен по формуле Миффлина — Сан Жеора: 10 × ${p.weight} + 6,25 × ${p.height} − 5 × ${p.age} ${sexTerm} ≈ ${t.bmr} ккал. Столько тело тратит в покое.`,
    `С учётом активности (× ${t.activityFactor.toString().replace(".", ",")}) расход ≈ ${t.tdee} ккал — это поддержание веса.`,
    `${t.goalShift < 0 ? "Минус" : "Плюс"} ${pct}% под цель «${GOAL[p.goal].label.toLowerCase()}» — ${t.kcal} ккал в день.`,
    `Белок ${t.proteinPerKg.toString().replace(".", ",")} г на кг — ${t.protein} г, он сохраняет и строит мышцы. Жиры ${t.fatPerKg.toString().replace(".", ",")} г на кг — ${t.fat} г. Остальное — углеводы, ${t.carbs} г.`,
    `Формула даёт оценку. Через 2 недели сверим со средним весом и поправим.`,
  ];
}
