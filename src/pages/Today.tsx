import { ChefHat, MessageSquarePlus, ShoppingBasket, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell, Block, MacroBars, MacroLine, TabHeader, Tile } from "../components/ui";
import { DOW_LONG, addDays, dayIndex, human, today } from "../lib/dates";
import { tapLight } from "../lib/haptics";
import { eatenDay, mainForDay, plannedDay } from "../lib/plan";
import { recipeById } from "../lib/recipes";
import { shoppingList } from "../lib/shopping";
import type { MealKey } from "../lib/types";
import { useStore } from "../state/store";

export const MEAL_LABEL: Record<MealKey, string> = { breakfast: "Завтрак", lunch: "Обед", dinner: "Ужин", snack: "Перекус" };

export default function Today() {
  const { state, setState, plan, prepPlan, targets } = useStore();
  if (!plan || !targets) return null;
  const date = today();
  const d = dayIndex(date);
  const planned = plannedDay(plan, state.schedule, d);
  const log = state.log[date] ?? [];
  const fact = eatenDay(planned, log);
  const replaced = new Set(log.filter((e) => e.mode === "replace").map((e) => e.meal));

  const cookToday = plan.mains.find((m) => m.cookDay === d);
  const cookRecipe = recipeById(cookToday?.recipeId);
  const buyToday = shoppingList(plan, state.schedule).filter((i) => i.buyDay === d);
  const tomorrow = (d + 1) % 7;
  const tomorrowPlan = d === 6 && prepPlan ? prepPlan : plan;
  const nextBreakfast = recipeById(tomorrowPlan.breakfasts[tomorrow]);
  const todayBreakfast = d === 6 ? null : plan.breakfasts[d];
  const batchTonight = nextBreakfast && nextBreakfast.servings > 1 && todayBreakfast !== nextBreakfast.id ? nextBreakfast : null;

  const remove = (id: string) =>
    setState((s) => ({ ...s, log: { ...s.log, [date]: (s.log[date] ?? []).filter((e) => e.id !== id) } }));

  return (
    <AppShell>
      <TabHeader title="Сегодня" subtitle={`${DOW_LONG[d][0].toUpperCase()}${DOW_LONG[d].slice(1)}, ${human(date)}`} />

      {cookRecipe && <Tile to={`/recipe/${cookRecipe.id}`} icon={ChefHat} tone="sky" title={`Готовка: ${cookRecipe.short}`} text={`4 порции на ${cookToday!.days.length > 1 ? "сегодня и завтра" : "сегодня"} · ${cookRecipe.minutes} мин`} />}
      {buyToday.length > 0 && (
        <Tile to="/shop" icon={ShoppingBasket} tone="rose" title="Купить к завтрашней готовке" text={buyToday.map((i) => i.name).join(", ")} />
      )}
      {batchTonight && (
        <Tile to={`/recipe/${batchTonight.id}`} icon={ChefHat} tone="lilac" title={`Вечером: ${batchTonight.short.toLowerCase()} на ${batchTonight.servings} утра`} text={`${batchTonight.minutes} мин, утром только разогреть`} />
      )}

      <Block title="Итог дня">
        <MacroBars fact={fact} target={targets} />
        <p className="mt-4 text-[13px] leading-snug text-muted-foreground">
          План считается съеденным. Если ели что-то другое — просто напишите, остальное посчитается само.
        </p>
        <Link to="/ate" onClick={tapLight} className="btn-primary mt-4 w-full">
          <MessageSquarePlus className="h-5 w-5" /> Съел другое
        </Link>
      </Block>

      <Block title="По плану">
        <ul className="flex flex-col">
          {planned.map((m, i) => {
            const off = replaced.has(m.meal);
            const entries = log.filter((e) => e.meal === m.meal);
            return (
              <li key={m.meal} className={i > 0 ? "border-t border-border pt-3 mt-3" : ""}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{MEAL_LABEL[m.meal]}</p>
                {m.recipe ? (
                  <Link to={`/recipe/${m.recipe.id}`} className={off ? "text-muted-foreground line-through" : ""}>
                    <span className="text-[15px] font-semibold leading-snug">{m.recipe.title}</span>
                  </Link>
                ) : (
                  <p className={`text-[15px] font-semibold ${off ? "text-muted-foreground line-through" : ""}`}>
                    {m.place === "out" ? "Вне дома" : "Не запланировано"}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">· средняя оценка</span>
                  </p>
                )}
                {!off && <MacroLine m={m.macros} className="mt-1" />}
                {entries.map((e) => (
                  <div key={e.id} className="mt-2 flex items-start gap-3 rounded-2xl bg-primary-soft px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold">
                        {e.mode === "replace" ? "Вместо этого: " : "Ещё: "}
                        {e.name}
                      </p>
                      <MacroLine m={e.macros} />
                    </div>
                    <button onClick={() => remove(e.id)} aria-label="Удалить запись" className="p-1 text-link">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      </Block>

      {(() => {
        const main = mainForDay(tomorrowPlan, tomorrow);
        const r = recipeById(main?.recipeId);
        if (!r) return null;
        return (
          <Block title="Завтра">
            <p className="text-[15px]">
              {nextBreakfast ? `${nextBreakfast.short} на завтрак, ` : ""}
              {r.short.toLowerCase()} на обед и ужин.
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">{human(addDays(date, 1))}</p>
          </Block>
        );
      })()}
    </AppShell>
  );
}
