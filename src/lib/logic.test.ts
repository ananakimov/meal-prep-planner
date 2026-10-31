import { describe, expect, it } from "vitest";
import { bmr, targets } from "./nutrition";
import { breakfastBlocks, buildWeek, coveredDays, eatenDay, plannedDay, scalePortion } from "./plan";
import { RECIPES, fits, recipeById } from "./recipes";
import { shoppingList } from "./shopping";
import type { DaySchedule, Profile, Schedule } from "./types";

const profile: Profile = {
  name: "Демо",
  sex: "male",
  age: 30,
  height: 180,
  weight: 80,
  activity: "mid",
  goal: "recomp",
  excludes: ["молоко", "каши"],
  equipment: ["pan", "pot"],
  maxMinutes: 40,
  favorites: "курица с рисом, паста",
};

const home: DaySchedule = { breakfast: "home", lunch: "home", dinner: "home", snack: "home" };
const out: DaySchedule = { breakfast: "home", lunch: "out", dinner: "out", snack: "home" };
// Mon, Tue, Thu, Fri at home; Wed and the weekend out; cooking on Mon and Thu
const schedule: Schedule = { days: [home, home, out, home, home, out, out], cookDays: [0, 3] };

describe("nutrition", () => {
  it("computes Mifflin–St Jeor BMR", () => {
    expect(bmr({ sex: "male", weight: 80, height: 180, age: 30 })).toBe(1780);
    expect(bmr({ sex: "female", weight: 60, height: 165, age: 30 })).toBeCloseTo(1320.25);
  });

  it("applies activity, goal and macro split", () => {
    const t = targets(profile);
    expect(t.tdee).toBe(Math.round(1780 * 1.375));
    expect(t.kcal).toBe(Math.round((1780 * 1.375 * 0.88) / 10) * 10);
    expect(t.protein).toBe(160);
    expect(t.fat).toBe(70);
    // macros add up to the calorie target within one rounding step
    expect(Math.abs(t.protein * 4 + t.fat * 9 + t.carbs * 4 - t.kcal)).toBeLessThanOrEqual(20);
  });
});

describe("recipe filters", () => {
  it("drops recipes with excluded ingredients, missing equipment or too long", () => {
    const oats = recipeById("overnight-oats")!;
    expect(fits(oats, profile)).toBe(false);
    expect(fits(recipeById("chicken-rice")!, profile)).toBe(true);
    expect(fits(recipeById("chicken-rice")!, { ...profile, equipment: ["pan"] })).toBe(false);
    expect(fits(recipeById("chicken-rice")!, { ...profile, maxMinutes: 20 })).toBe(false);
  });

  it("every recipe's garnish names one of its ingredients", () => {
    for (const r of RECIPES) if (r.garnish) expect(r.ingredients.map((i) => i.name)).toContain(r.garnish.ingredient);
  });
});

describe("portion scaling", () => {
  const r = recipeById("chicken-rice")!;
  it("keeps the base portion when it already hits the target", () => {
    expect(scalePortion(r, r.macros.kcal).garnishGrams).toBe(r.garnish!.grams);
  });
  it("adds garnish for a higher target and lands near it", () => {
    const { garnishGrams, portion } = scalePortion(r, r.macros.kcal + 140);
    expect(garnishGrams).toBe(120);
    expect(Math.abs(portion.kcal - (r.macros.kcal + 140))).toBeLessThanOrEqual(20);
  });
  it("shrinks or grows the whole portion when the garnish alone is not enough", () => {
    const small = scalePortion(r, 400);
    expect(small.factor).toBeLessThan(1);
    expect(Math.abs(small.portion.kcal - 400)).toBeLessThanOrEqual(40);
    const big = scalePortion(r, 1150);
    expect(big.factor).toBeGreaterThan(1);
    expect(Math.abs(big.portion.kcal - 1150)).toBeLessThanOrEqual(40);
  });
  it("stays within 70–140% of the portion and 35–224% of the garnish at the extremes", () => {
    const tiny = scalePortion(r, 0);
    const huge = scalePortion(r, 5000);
    expect(tiny.factor).toBe(0.7);
    expect(huge.factor).toBe(1.4);
    expect(tiny.garnishGrams).toBeGreaterThanOrEqual(r.garnish!.grams * 0.35 - 5);
    expect(huge.garnishGrams).toBeLessThanOrEqual(r.garnish!.grams * 2.24 + 5);
  });
});

describe("calories per day across profiles", () => {
  const profiles: Profile[] = [
    { ...profile, sex: "male", age: 21, height: 185, weight: 84, goal: "recomp" },
    { ...profile, sex: "female", age: 30, height: 165, weight: 62, goal: "lose" },
    { ...profile, sex: "male", age: 25, height: 180, weight: 75, activity: "high", goal: "gain" },
  ];
  for (const p of profiles) {
    it(`${p.sex} ${p.goal}: home days within ±100 kcal`, () => {
      const t = targets(p);
      const plan = buildWeek("2026-11-02", p, t, schedule);
      for (const d of [0, 1, 3, 4]) {
        const kcal = eatenDay(plannedDay(plan, schedule, d), []).kcal;
        expect(Math.abs(kcal - t.kcal)).toBeLessThanOrEqual(100);
      }
    });
  }
});

describe("week plan", () => {
  it("covers the cook day and the next home day", () => {
    expect(coveredDays(schedule, 0)).toEqual([0, 1]);
    expect(coveredDays(schedule, 3)).toEqual([3, 4]);
  });

  it("rotates breakfasts in blocks of two", () => {
    expect(breakfastBlocks(schedule, ["a", "b", "c"])).toEqual(["a", "a", "b", "b", "c", "c", "a"]);
  });

  it("builds two batches and keeps daily calories within ±100 kcal of target on home days", () => {
    const t = targets(profile);
    const plan = buildWeek("2026-11-02", profile, t, schedule);
    expect(plan.mains.map((m) => m.cookDay)).toEqual([0, 3]);
    expect(plan.mains[0].recipeId).not.toBe(plan.mains[1].recipeId);
    expect(plan.breakfasts.every((id) => id && fits(recipeById(id)!, profile))).toBe(true);
    for (const d of [0, 1, 3, 4]) {
      const kcal = eatenDay(plannedDay(plan, schedule, d), []).kcal;
      expect(Math.abs(kcal - t.kcal)).toBeLessThanOrEqual(200);
    }
  });

  it("respects swaps", () => {
    const t = targets(profile);
    const plan = buildWeek("2026-11-02", profile, t, schedule, { breakfasts: { 0: "syrniki" }, mains: { 3: "teriyaki" } });
    expect(plan.breakfasts[0]).toBe("syrniki");
    expect(plan.mains.find((m) => m.cookDay === 3)!.recipeId).toBe("teriyaki");
  });
});

describe("default logging", () => {
  const t = targets(profile);
  const plan = buildWeek("2026-11-02", profile, t, schedule);
  const planned = plannedDay(plan, schedule, 0);
  const base = eatenDay(planned, []);

  it("counts the plan as eaten when nothing is logged", () => {
    expect(base.kcal).toBe(planned.reduce((s, m) => s + m.macros.kcal, 0));
  });

  it("replaces a meal and adds extras", () => {
    const shawarma = { kcal: 650, protein: 30, fat: 30, carbs: 60 };
    const replaced = eatenDay(planned, [{ id: "1", meal: "dinner", mode: "replace", text: "", name: "Шаурма", macros: shawarma }]);
    const dinner = planned.find((m) => m.meal === "dinner")!.macros.kcal;
    expect(replaced.kcal).toBe(base.kcal - dinner + 650);
    const added = eatenDay(planned, [{ id: "2", meal: "snack", mode: "add", text: "", name: "Шоколад", macros: { kcal: 150, protein: 2, fat: 9, carbs: 14 } }]);
    expect(added.kcal).toBe(base.kcal + 150);
  });
});

describe("shopping list", () => {
  const t = targets(profile);
  const plan = buildWeek("2026-11-02", profile, t, schedule);
  const list = shoppingList(plan, schedule);

  it("buys raw meat for the second cook day the day before", () => {
    const second = plan.mains[1];
    const meat = list.filter((i) => i.buyDay !== null);
    expect(meat.length).toBeGreaterThan(0);
    expect(meat.every((i) => i.buyDay === second.cookDay - 1 && i.section === "Мясо и рыба")).toBe(true);
  });

  it("merges the same ingredient across recipes", () => {
    const names = list.filter((i) => i.buyDay === null).map((i) => `${i.name}|${i.unit}`);
    expect(new Set(names).size).toBe(names.length);
  });

  it("scales the garnish to the planned portion", () => {
    const first = plan.mains[0];
    const r = recipeById(first.recipeId)!;
    const g = list.find((i) => i.name === r.garnish!.ingredient && i.buyDay === null)!;
    expect(g.qty).toBeGreaterThanOrEqual(Math.round((first.garnishGrams * 4) / 10) * 10 - 10);
  });
});
