import { Lightbulb } from "lucide-react";
import { useParams } from "react-router-dom";
import { AppShell, Block, MacroLine, ScreenHeader } from "../components/ui";
import { recipeById } from "../lib/recipes";
import { formatQty } from "../lib/shopping";
import { useStore } from "../state/store";

export default function RecipePage() {
  const { id } = useParams();
  const { plan, prepPlan } = useStore();
  const r = recipeById(id);
  if (!r) return null;
  const slot = plan?.mains.find((m) => m.recipeId === r.id) ?? prepPlan?.mains.find((m) => m.recipeId === r.id);
  const portion = slot?.portion ?? r.macros;
  const servingsWord = r.servings === 1 ? "порция" : r.servings < 5 ? "порции" : "порций";

  const qtyFor = (name: string, qty: number, pantry?: boolean) => {
    if (!slot) return qty;
    if (r.garnish && name === r.garnish.ingredient) return Math.round((qty * slot.garnishGrams) / r.garnish.grams / 5) * 5;
    return pantry ? qty : Math.round(qty * slot.factor * 10) / 10;
  };

  return (
    <AppShell tabs={false}>
      <ScreenHeader title={r.title} subtitle={`${r.minutes} мин · ${r.servings} ${servingsWord}`} />

      <Block title="Порция">
        <MacroLine m={portion} className="text-sm" />
        {r.fiber > 0 && <p className="mt-1 text-xs text-muted-foreground">Клетчатка ≈ {r.fiber} г</p>}
        {slot && r.garnish && (
          <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
            Порция подогнана под вашу норму: {r.garnish.ingredient.toLowerCase()} — {slot.garnishGrams} г сухого на порцию
            {slot.factor !== 1 ? `, остальное × ${slot.factor.toString().replace(".", ",")}` : ""}.
          </p>
        )}
        {r.note && <p className="mt-3 text-[13px] text-muted-foreground">{r.note}</p>}
      </Block>

      <Block title="Продукты">
        <ul className="flex flex-col">
          {r.ingredients.map((i, n) => (
            <li key={i.name} className={`flex justify-between gap-3 py-2.5 text-[15px] ${n > 0 ? "border-t border-border" : ""}`}>
              <span>{i.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatQty({ qty: qtyFor(i.name, i.qty, i.pantry), unit: i.unit })}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Как готовить">
        <ol className="flex flex-col gap-3">
          {r.steps.map((s, n) => (
            <li key={n} className="flex gap-3 text-[15px] leading-snug">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-link" style={{ background: "hsl(var(--primary) / 0.12)" }}>
                {n + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </Block>

      {r.tips && (
        <Block title="Если не получается">
          <ul className="flex flex-col gap-2.5">
            {r.tips.map((t) => (
              <li key={t} className="flex gap-3 text-[14px] leading-snug">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-link" />
                {t}
              </li>
            ))}
          </ul>
        </Block>
      )}
    </AppShell>
  );
}
