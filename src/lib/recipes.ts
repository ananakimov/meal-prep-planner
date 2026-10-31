import data from "../data/recipes.json";
import type { Profile, Recipe } from "./types";

export const RECIPES = data as Recipe[];

export function recipeById(id: string | null | undefined): Recipe | undefined {
  return id ? RECIPES.find((r) => r.id === id) : undefined;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/ё/g, "е");

/** A recipe fits when it needs no excluded ingredient, no missing equipment and no more time than allowed */
export function fits(r: Recipe, p: Pick<Profile, "excludes" | "equipment" | "maxMinutes">): boolean {
  const ex = p.excludes.map(norm).filter(Boolean);
  const words = [...r.contains, r.title].map(norm);
  if (ex.some((e) => words.some((w) => w.includes(e)))) return false;
  if (r.equipment.some((eq) => !p.equipment.includes(eq))) return false;
  return r.minutes <= p.maxMinutes;
}

/** Favourites typed as free text float to the top when a recipe title shares a word with them */
export function favouriteScore(r: Recipe, favourites: string): number {
  const fav = norm(favourites);
  if (!fav) return 0;
  return norm(r.title)
    .split(/[^a-zа-я]+/)
    .filter((w) => w.length >= 4)
    .reduce((s, w) => s + (fav.includes(w.slice(0, 5)) ? 1 : 0), 0);
}

export function candidates(type: Recipe["type"], p: Profile): Recipe[] {
  return RECIPES.filter((r) => r.type === type && fits(r, p)).sort(
    (a, b) => favouriteScore(b, p.favorites) - favouriteScore(a, p.favorites),
  );
}
