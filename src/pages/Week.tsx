import { ChefHat, Repeat2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell, Block, MacroLine, RecipeCard, TabHeader } from "../components/ui";
import { cn } from "../lib/cn";
import { DOW, DOW_LONG, addDays, dayIndex, human, monday, today } from "../lib/dates";
import { tapLight } from "../lib/haptics";
import { eatenDay, mainForDay, plannedDay } from "../lib/plan";
import { recipeById } from "../lib/recipes";
import { useStore } from "../state/store";

export default function Week() {
  const { state, prepPlan: plan, prepStart: weekStart, targets } = useStore();
  if (!plan || !targets) return null;
  const now = monday(today()) === weekStart ? dayIndex(today()) : -1;

  return (
    <AppShell>
      <TabHeader title={now < 0 ? "Следующая неделя" : "Неделя"} subtitle={`${human(weekStart)} — ${human(addDays(weekStart, 6))}`} />

      <Block title="Готовка" more={<Link to="/schedule" className="text-sm font-medium text-link">Дни</Link>}>
        {plan.mains.length ? (
          <div className="no-scrollbar -mr-4 flex gap-3 overflow-x-auto pb-1 pr-4">
            {plan.mains.map((m) => {
              const r = recipeById(m.recipeId)!;
              return <RecipeCard key={m.cookDay} r={r} to={`/recipe/${r.id}`} label={`${DOW[m.cookDay]} → ${m.days.map((x) => DOW[x]).join(", ")}`} macros={m.portion} />;
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Нет дней готовки — отметьте их в расписании.</p>
        )}
      </Block>

      <section className="flex flex-col gap-3 px-5 pt-5">
        {DOW.map((_, d) => {
          const planned = plannedDay(plan, state.schedule, d);
          const main = mainForDay(plan, d);
          const mainR = recipeById(main?.recipeId);
          const breakfast = recipeById(plan.breakfasts[d]);
          const kcal = eatenDay(planned, state.log[addDays(weekStart, d)] ?? []).kcal;
          const isCook = plan.mains.some((m) => m.cookDay === d);
          return (
            <article
              key={d}
              className={cn(
                "rounded-[20px] bg-card p-4 shadow-card",
                d === now && "outline outline-2 -outline-offset-2 outline-[hsl(var(--link))]",
              )}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="font-display text-[17px] font-bold">
                  {DOW_LONG[d][0].toUpperCase() + DOW_LONG[d].slice(1)} <span className="text-sm font-medium text-muted-foreground">{human(addDays(weekStart, d))}</span>
                </h2>
                <span className={cn("text-xs tabular-nums", Math.abs(kcal - targets.kcal) > 150 ? "text-muted-foreground" : "text-foreground")}>
                  ≈ {kcal} ккал
                </span>
              </div>
              {isCook && (
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-link" style={{ background: "hsl(var(--primary) / 0.12)" }}>
                  <ChefHat className="h-3.5 w-3.5" /> День готовки
                </p>
              )}
              <Row label="Завтрак" title={breakfast?.short ?? "вне дома"} href={breakfast && `/recipe/${breakfast.id}`} swap={breakfast && `/swap/breakfast/${d}`} />
              <Row
                label="Обед и ужин"
                title={mainR ? mainR.short : planned[1].place === "out" && planned[2].place === "out" ? "вне дома" : "не запланировано"}
                href={mainR && `/recipe/${mainR.id}`}
                swap={main && `/swap/main/${main.cookDay}`}
              />
              {main && <MacroLine m={main.portion} className="mt-1 pl-[92px]" />}
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}

function Row({ label, title, href, swap }: { label: string; title: string; href?: string | false; swap?: string | false }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-[80px] shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      {href ? (
        <Link to={href} onClick={tapLight} className="min-w-0 flex-1 truncate text-[15px] font-semibold">
          {title}
        </Link>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[15px] text-muted-foreground">{title}</span>
      )}
      {swap && (
        <Link to={swap} onClick={tapLight} aria-label={`Заменить: ${title}`} className="p-1 text-link">
          <Repeat2 className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
