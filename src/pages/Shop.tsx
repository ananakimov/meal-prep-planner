import { Bot } from "lucide-react";
import { useState } from "react";
import { AppShell, Block, Chip, TabHeader } from "../components/ui";
import { cn } from "../lib/cn";
import { DOW_LONG, addDays, human } from "../lib/dates";
import { SECTION_ORDER, formatQty, shoppingList, type ShopItem } from "../lib/shopping";
import { useStore } from "../state/store";

export default function Shop() {
  const { state, setState, prepPlan: plan, prepStart: weekStart } = useStore();
  const [tab, setTab] = useState<"week" | "later" | "pantry">("week");
  if (!plan) return null;
  const all = shoppingList(plan, state.schedule);
  const checks = state.shop[weekStart] ?? {};
  const week = all.filter((i) => i.buyDay === null && !i.pantry);
  const later = all.filter((i) => i.buyDay !== null);
  const pantry = all.filter((i) => i.buyDay === null && i.pantry);
  const list = tab === "week" ? week : tab === "later" ? later : pantry;
  const done = list.filter((i) => checks[i.key]).length;

  const toggle = (key: string) =>
    setState((s) => ({ ...s, shop: { ...s.shop, [weekStart]: { ...(s.shop[weekStart] ?? {}), [key]: !checks[key] } } }));
  const reset = () => setState((s) => ({ ...s, shop: { ...s.shop, [weekStart]: {} } }));

  return (
    <AppShell>
      <TabHeader title="Покупки" subtitle={`На неделю ${human(weekStart)} — ${human(addDays(weekStart, 6))}`} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4">
        <Chip active={tab === "week"} onClick={() => setTab("week")}>
          На неделю · {week.length}
        </Chip>
        {later.length > 0 && (
          <Chip active={tab === "later"} onClick={() => setTab("later")}>
            Накануне готовки · {later.length}
          </Chip>
        )}
        <Chip active={tab === "pantry"} onClick={() => setTab("pantry")}>
          Проверить дома · {pantry.length}
        </Chip>
      </div>

      {tab === "later" && (
        <p className="px-5 pt-3 text-[13px] text-muted-foreground">Сырое мясо и рыба хранятся 1–2 дня, поэтому их лучше купить за день до готовки.</p>
      )}
      {tab === "pantry" && <p className="px-5 pt-3 text-[13px] text-muted-foreground">Обычно это уже есть. Отметьте, если нужно докупить.</p>}

      <section className="px-5 pt-4">
        <div className="mb-1 flex justify-between text-[13px] text-muted-foreground">
          <span>
            Куплено {done} из {list.length}
          </span>
          {done > 0 && (
            <button className="font-medium text-link" onClick={reset}>
              Снять галочки
            </button>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} />
        </div>
      </section>

      {groups(list, tab === "later").map(([title, items]) => (
        <Block key={title} title={title}>
          <ul className="flex flex-col">
            {items.map((i, n) => (
              <li key={i.key} className={cn(n > 0 && "border-t border-border")}>
                <label className="flex cursor-pointer items-center gap-3 py-3">
                  <input type="checkbox" className="h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" checked={!!checks[i.key]} onChange={() => toggle(i.key)} />
                  <span className={cn("min-w-0 flex-1", checks[i.key] && "text-muted-foreground line-through")}>
                    <span className="block text-[15px] font-medium leading-snug">{i.name}</span>
                    <span className="block text-[12px] text-muted-foreground">{i.forRecipes.join(", ")}</span>
                  </span>
                  <span className="shrink-0 text-[14px] tabular-nums text-muted-foreground">{formatQty(i)}</span>
                </label>
              </li>
            ))}
          </ul>
        </Block>
      ))}

      <Block>
        <div className="flex items-start gap-3">
          <Bot className="mt-0.5 h-6 w-6 shrink-0 text-link" />
          <p className="text-[13px] leading-snug text-muted-foreground">
            Корзину в магазине по этому списку может собрать ИИ-агент через ВкусВилл MCP — инструкция в папке{" "}
            <a className="font-medium text-link" href="https://github.com/ananakimov/meal-prep-planner/tree/main/agent" target="_blank" rel="noreferrer">
              agent/
            </a>{" "}
            репозитория.
          </p>
        </div>
      </Block>
    </AppShell>
  );
}

function groups(items: ShopItem[], byDay: boolean): [string, ShopItem[]][] {
  if (byDay) {
    const days = [...new Set(items.map((i) => i.buyDay!))].sort();
    return days.map((d) => [`Купить: ${DOW_LONG[d]}`, items.filter((i) => i.buyDay === d)]);
  }
  return SECTION_ORDER.map((s) => [s, items.filter((i) => i.section === s)] as [string, ShopItem[]]).filter(([, l]) => l.length);
}
