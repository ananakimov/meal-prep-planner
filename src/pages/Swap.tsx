import { Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell, Block, MacroLine, ScreenHeader } from "../components/ui";
import { cn } from "../lib/cn";
import { DOW_LONG } from "../lib/dates";
import { tapMedium } from "../lib/haptics";
import { candidates } from "../lib/recipes";
import { useStore } from "../state/store";

export default function Swap() {
  const { kind, day } = useParams();
  const d = Number(day);
  const { state, setState, prepPlan: plan, prepStart: weekStart } = useStore();
  const navigate = useNavigate();
  if (!plan || !state.profile || (kind !== "breakfast" && kind !== "main")) return null;
  const list = candidates(kind, state.profile);
  const current = kind === "breakfast" ? plan.breakfasts[d] : plan.mains.find((m) => m.cookDay === d)?.recipeId;

  const pick = (id: string) => {
    tapMedium();
    setState((s) => {
      const o = s.overrides[weekStart] ?? { breakfasts: {}, mains: {} };
      const next = kind === "breakfast" ? { ...o, breakfasts: { ...o.breakfasts, [d]: id } } : { ...o, mains: { ...o.mains, [d]: id } };
      return { ...s, overrides: { ...s.overrides, [weekStart]: next } };
    });
    navigate(-1);
  };

  return (
    <AppShell tabs={false}>
      <ScreenHeader title={kind === "breakfast" ? "Заменить завтрак" : "Заменить блюдо"} subtitle={kind === "breakfast" ? DOW_LONG[d] : `готовка: ${DOW_LONG[d]}`} />
      <Block>
        <p className="mb-2 text-[13px] text-muted-foreground">Только рецепты под ваши ограничения, технику и время.</p>
        <ul className="flex flex-col">
          {list.map((r, n) => (
            <li key={r.id} className={cn(n > 0 && "border-t border-border")}>
              <button onClick={() => pick(r.id)} className="flex w-full items-center gap-3 py-3.5 text-left active:scale-[0.99]">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">{r.title}</p>
                  <MacroLine m={r.macros} className="mt-1" />
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.minutes} мин</p>
                </div>
                {r.id === current && <Check className="h-5 w-5 shrink-0 text-link" />}
              </button>
            </li>
          ))}
        </ul>
      </Block>
    </AppShell>
  );
}
