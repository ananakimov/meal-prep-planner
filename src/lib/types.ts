export type Sex = "male" | "female";
export type Activity = "low" | "mid" | "high";
export type Goal = "lose" | "recomp" | "gain";
export type Equipment = "pan" | "pot" | "oven" | "multicooker";
export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";
export type Place = "home" | "out";

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  height: number;
  weight: number;
  activity: Activity;
  goal: Goal;
  excludes: string[];
  equipment: Equipment[];
  maxMinutes: number;
  favorites: string;
}

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Targets extends Macros {
  fiber: number;
  bmr: number;
  tdee: number;
  activityFactor: number;
  goalShift: number;
  proteinPerKg: number;
  fatPerKg: number;
}

export type DaySchedule = Record<MealKey, Place>;

export interface Schedule {
  /** Monday-first, 7 entries */
  days: DaySchedule[];
  /** Monday-first day indexes (0..6) when the user cooks */
  cookDays: number[];
}

export type Section = "Мясо и рыба" | "Молочное и яйца" | "Хлеб и бакалея" | "Овощи и фрукты" | "Заморозка" | "Специи и масло";

export interface Ingredient {
  name: string;
  qty: number;
  unit: "г" | "мл" | "шт" | "уп." | "банка" | "ст. л." | "ч. л." | "по вкусу";
  section: Section;
  /** raw meat/fish: buy the day before cooking */
  perishable?: boolean;
  /** pantry item most people have at home */
  pantry?: boolean;
}

export interface Garnish {
  /** name of the ingredient that is scaled to hit the calorie target */
  ingredient: string;
  /** grams per portion in the base recipe */
  grams: number;
  per100: Macros;
}

export interface Recipe {
  id: string;
  title: string;
  short: string;
  type: "breakfast" | "main" | "snack";
  minutes: number;
  /** portions the ingredient list makes */
  servings: number;
  /** per portion */
  macros: Macros;
  fiber: number;
  equipment: Equipment[];
  /** words that the recipe contains, matched against the user's excludes */
  contains: string[];
  ingredients: Ingredient[];
  steps: string[];
  tips?: string[];
  garnish?: Garnish;
  note?: string;
}

export interface MainSlot {
  cookDay: number;
  /** days whose home lunch/dinner this batch covers */
  days: number[];
  recipeId: string;
  /** scaled garnish grams per portion */
  garnishGrams: number;
  /** multiplier for every other ingredient of the batch (0.7–1.4) */
  factor: number;
  portion: Macros;
}

export interface WeekPlan {
  weekStart: string;
  /** recipe id per day for home breakfasts, null when out */
  breakfasts: (string | null)[];
  mains: MainSlot[];
  snackId: string | null;
}

export interface LogEntry {
  id: string;
  meal: MealKey;
  mode: "replace" | "add";
  text: string;
  name: string;
  macros: Macros;
}

export interface WeightEntry {
  date: string;
  kg: number;
}

export interface Overrides {
  breakfasts: Record<number, string>;
  mains: Record<number, string>;
}
