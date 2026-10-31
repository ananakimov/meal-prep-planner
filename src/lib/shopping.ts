import { recipeById } from "./recipes";
import type { Ingredient, Schedule, Section, WeekPlan } from "./types";

export interface ShopItem {
  key: string;
  name: string;
  qty: number;
  unit: Ingredient["unit"];
  section: Section;
  pantry: boolean;
  /** Monday-first day to buy on; null = the weekly order */
  buyDay: number | null;
  forRecipes: string[];
}

export const SECTION_ORDER: Section[] = ["Мясо и рыба", "Молочное и яйца", "Овощи и фрукты", "Хлеб и бакалея", "Заморозка", "Специи и масло"];

/**
 * One weekly list. Raw meat for the second and later cook days goes to a separate
 * "buy the day before" list: it keeps 1–2 days in the fridge.
 */
export function shoppingList(plan: WeekPlan, schedule: Schedule): ShopItem[] {
  const map = new Map<string, ShopItem>();
  const firstCook = Math.min(...plan.mains.map((m) => m.cookDay), 7);

  const push = (ing: Ingredient, factor: number, recipeTitle: string, buyDay: number | null) => {
    const key = `${ing.name}|${ing.unit}|${buyDay ?? "w"}`;
    const prev = map.get(key);
    const qty = ing.qty * factor;
    if (prev) {
      prev.qty += qty;
      if (!prev.forRecipes.includes(recipeTitle)) prev.forRecipes.push(recipeTitle);
    } else {
      map.set(key, {
        key,
        name: ing.name,
        qty,
        unit: ing.unit,
        section: ing.section,
        pantry: !!ing.pantry,
        buyDay,
        forRecipes: [recipeTitle],
      });
    }
  };

  for (const m of plan.mains) {
    const r = recipeById(m.recipeId);
    if (!r) continue;
    for (const ing of r.ingredients) {
      let factor = ing.pantry ? 1 : m.factor;
      if (r.garnish && ing.name === r.garnish.ingredient) factor = m.garnishGrams / r.garnish.grams;
      const buyDay = ing.perishable && m.cookDay !== firstCook ? Math.max(0, m.cookDay - 1) : null;
      push(ing, factor, r.short, buyDay);
    }
  }

  // breakfasts: count home mornings per recipe, cook in whole batches
  const counts = new Map<string, number>();
  plan.breakfasts.forEach((id) => id && counts.set(id, (counts.get(id) ?? 0) + 1));
  for (const [id, mornings] of counts) {
    const r = recipeById(id);
    if (!r) continue;
    const batches = Math.ceil(mornings / r.servings);
    for (const ing of r.ingredients) push(ing, batches, r.short, null);
  }

  const snack = recipeById(plan.snackId);
  if (snack) {
    const days = schedule.days.filter((d) => d.snack === "home").length;
    for (const ing of snack.ingredients) push(ing, days, snack.short, null);
  }

  return [...map.values()]
    .map((i) => ({ ...i, qty: roundQty(i.qty, i.unit) }))
    .sort((a, b) => SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section) || a.name.localeCompare(b.name, "ru"));
}

function roundQty(q: number, unit: Ingredient["unit"]): number {
  if (unit === "г" || unit === "мл") return q >= 100 ? Math.round(q / 10) * 10 : Math.round(q);
  return Math.ceil(q * 2) / 2;
}

export function formatQty(i: Pick<ShopItem, "qty" | "unit">): string {
  if (i.unit === "по вкусу") return "по вкусу";
  if (i.unit === "г" && i.qty >= 1000) return `${(i.qty / 1000).toString().replace(".", ",")} кг`;
  return `${i.qty.toString().replace(".", ",")} ${i.unit}`;
}
