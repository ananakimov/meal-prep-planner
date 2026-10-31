import { Home, Utensils } from "lucide-react";
import { cn } from "../lib/cn";
import { DOW } from "../lib/dates";
import { tapLight } from "../lib/haptics";
import type { MealKey, Schedule } from "../lib/types";
import { Chip } from "./ui";

const MEALS: { key: MealKey; label: string }[] = [
  { key: "breakfast", label: "Завтрак" },
  { key: "lunch", label: "Обед" },
  { key: "dinner", label: "Ужин" },
  { key: "snack", label: "Перекус" },
];

export function ScheduleGrid({ value, onChange }: { value: Schedule; onChange: (s: Schedule) => void }) {
  const toggle = (d: number, m: MealKey) => {
    tapLight();
    const days = value.days.map((x, i) => (i === d ? { ...x, [m]: x[m] === "home" ? "out" : "home" } : x));
    onChange({ ...value, days });
  };
  const toggleCook = (d: number) => {
    const has = value.cookDays.includes(d);
    const cookDays = has ? value.cookDays.filter((x) => x !== d) : [...value.cookDays, d].sort((a, b) => a - b);
    onChange({ ...value, cookDays });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Нажмите на клетку, если этот приём пищи будет не дома.</p>
        <div className="grid grid-cols-[68px_repeat(7,minmax(0,1fr))] gap-1 text-center text-[11px]">
          <span />
          {DOW.map((d) => (
            <span key={d} className="pb-1 font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
          {MEALS.map((m) => (
            <Row key={m.key} label={m.label}>
              {value.days.map((day, i) => {
                const home = day[m.key] === "home";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle(i, m.key)}
                    aria-label={`${DOW[i]}, ${m.label}: ${home ? "дома" : "не дома"}`}
                    aria-pressed={home}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-xl transition active:scale-90",
                      home ? "bg-primary-soft text-link" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {home ? <Home className="h-4 w-4" /> : <Utensils className="h-4 w-4" />}
                  </button>
                );
              })}
            </Row>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Home className="h-3.5 w-3.5 text-link" /> дома
          </span>
          <span className="inline-flex items-center gap-1">
            <Utensils className="h-3.5 w-3.5" /> кафе, офис, в гостях
          </span>
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-[15px] font-semibold">Когда готовите</h3>
        <p className="mb-3 text-sm text-muted-foreground">Каждая готовка — 4 порции на этот и следующий день.</p>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {DOW.map((d, i) => (
            <Chip key={d} active={value.cookDays.includes(i)} onClick={() => toggleCook(i)}>
              {d}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="flex items-center text-left text-[12px] font-medium">{label}</span>
      {children}
    </>
  );
}
