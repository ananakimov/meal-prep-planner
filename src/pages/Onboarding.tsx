import { ArrowLeft, CalendarCheck, ListChecks, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ScheduleGrid } from "../components/ScheduleGrid";
import { AppShell, Chip, MacroLine } from "../components/ui";
import { cn } from "../lib/cn";
import { tapLight, tapMedium } from "../lib/haptics";
import { ACTIVITY, GOAL, explain, targets } from "../lib/nutrition";
import { DEFAULT_SCHEDULE } from "../lib/storage";
import type { Activity, Equipment, Goal, Profile, Schedule, Sex } from "../lib/types";
import { useStore } from "../state/store";

const EXCLUDE_OPTIONS = ["молоко", "каши", "лактоза", "глютен", "яйца", "рыба", "свинина", "орехи", "соя"];
const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: "pan", label: "Сковорода" },
  { id: "pot", label: "Кастрюля" },
  { id: "oven", label: "Духовка" },
  { id: "multicooker", label: "Мультиварка" },
];

const DEMO: Profile = {
  name: "Демо",
  sex: "male",
  age: 28,
  height: 180,
  weight: 82,
  activity: "mid",
  goal: "recomp",
  excludes: ["молоко", "каши"],
  equipment: ["pan", "pot"],
  maxMinutes: 40,
  favorites: "курица с рисом, паста с фаршем",
};

const DEMO_SCHEDULE: Schedule = {
  days: DEFAULT_SCHEDULE.days.map((d, i) => (i === 2 ? { ...d, lunch: "out", dinner: "out" } : d)),
  cookDays: [0, 3],
};

const STEPS = 7;

export default function Onboarding() {
  const { state, setState } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(
    state.profile ?? { ...DEMO, name: "", age: 0, height: 0, weight: 0, excludes: [], favorites: "" },
  );
  const [schedule, setSchedule] = useState<Schedule>(state.schedule);
  const [customExclude, setCustomExclude] = useState("");

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const bodyOk = p.age >= 14 && p.age <= 90 && p.height >= 130 && p.height <= 230 && p.weight >= 35 && p.weight <= 250;
  const t = bodyOk ? targets(p) : null;

  const next = () => {
    tapLight();
    setStep((s) => Math.min(STEPS - 1, s + 1));
  };
  const back = () => {
    tapLight();
    setStep((s) => Math.max(0, s - 1));
  };
  const finish = (profile: Profile, sch: Schedule) => {
    tapMedium();
    setState((s) => ({ ...s, profile, schedule: sch }));
    navigate("/", { replace: true });
  };

  return (
    <AppShell tabs={false}>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-2 px-4 pt-6">
          {step > 0 ? (
            <button onClick={back} aria-label="Назад" className="flex h-10 w-10 items-center justify-center text-link active:scale-90">
              <ArrowLeft className="h-6 w-6" />
            </button>
          ) : (
            <span className="h-10 w-10" />
          )}
          <div className="flex flex-1 gap-1.5 pr-4" aria-hidden>
            {Array.from({ length: STEPS }, (_, i) => (
              <i key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-secondary")} />
            ))}
          </div>
        </header>

        <main className="flex flex-1 flex-col px-5 pt-6">
          {step === 0 && (
            <Step title="План еды на неделю за 3 минуты" lead="Вы готовите 2 раза в неделю — остальное приложение берёт на себя.">
              <ul className="flex flex-col gap-3">
                <Feature icon={Sparkles} title="Норма под вашу цель" text="Калории и БЖУ с понятным расчётом" />
                <Feature icon={CalendarCheck} title="Меню под ваше расписание" text="Готовка на 2 дня, завтраки блоками" />
                <Feature icon={ListChecks} title="Список покупок и учёт без рутины" text="План считается съеденным — вносите только другое" />
              </ul>
              <div className="mt-auto flex flex-col gap-2 pb-8 pt-8">
                <button className="btn-primary" onClick={next}>
                  Начать
                </button>
                <button className="btn-secondary" onClick={() => finish(DEMO, DEMO_SCHEDULE)}>
                  Посмотреть на демо-профиле
                </button>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="О себе" lead="Нужно для расчёта нормы. Данные остаются только в этом браузере.">
              <div className="mb-4 flex gap-2">
                {(["male", "female"] as Sex[]).map((s) => (
                  <Chip key={s} active={p.sex === s} onClick={() => set("sex", s)}>
                    {s === "male" ? "Мужчина" : "Женщина"}
                  </Chip>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <NumField label="Возраст" value={p.age} onChange={(v) => set("age", v)} suffix="лет" />
                <NumField label="Рост" value={p.height} onChange={(v) => set("height", v)} suffix="см" />
                <NumField label="Вес" value={p.weight} onChange={(v) => set("weight", v)} suffix="кг" step={0.1} />
              </div>
              <Next disabled={!bodyOk} onClick={next} />
            </Step>
          )}

          {step === 2 && (
            <Step title="Активность и цель">
              <h3 className="mb-2 text-[15px] font-semibold">Активность</h3>
              <Options
                value={p.activity}
                options={(Object.keys(ACTIVITY) as Activity[]).map((k) => ({ id: k, title: ACTIVITY[k].label, text: ACTIVITY[k].hint }))}
                onChange={(v) => set("activity", v)}
              />
              <h3 className="mb-2 mt-6 text-[15px] font-semibold">Цель</h3>
              <Options
                value={p.goal}
                options={(Object.keys(GOAL) as Goal[]).map((k) => ({ id: k, title: GOAL[k].label, text: GOAL[k].hint }))}
                onChange={(v) => set("goal", v)}
              />
              <Next onClick={next} />
            </Step>
          )}

          {step === 3 && t && (
            <Step title={`Ваша норма — ${t.kcal} ккал`}>
              <div className="rounded-[20px] bg-card p-4 shadow-card">
                <MacroLine m={t} className="text-sm" />
                <ol className="mt-4 flex list-decimal flex-col gap-2.5 pl-5 text-[14px] leading-snug">
                  {explain(p, t).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </div>
              <Next onClick={next} />
            </Step>
          )}

          {step === 4 && (
            <Step title="Ограничения" lead="Рецепты с этим не попадут в план.">
              <h3 className="mb-2 text-[15px] font-semibold">Не ем</h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...EXCLUDE_OPTIONS, ...p.excludes])].map((e) => (
                  <Chip
                    key={e}
                    active={p.excludes.includes(e)}
                    onClick={() => set("excludes", p.excludes.includes(e) ? p.excludes.filter((x) => x !== e) : [...p.excludes, e])}
                  >
                    {e}
                  </Chip>
                ))}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(ev) => {
                  ev.preventDefault();
                  const v = customExclude.trim().toLowerCase();
                  if (v && !p.excludes.includes(v)) set("excludes", [...p.excludes, v]);
                  setCustomExclude("");
                }}
              >
                <input className="field h-10" placeholder="Другое, например «грибы»" value={customExclude} onChange={(e) => setCustomExclude(e.target.value)} />
                <button className="btn-secondary h-10 px-4 text-sm" type="submit">
                  Добавить
                </button>
              </form>
              <h3 className="mb-2 mt-6 text-[15px] font-semibold">Что есть на кухне</h3>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT.map((e) => (
                  <Chip
                    key={e.id}
                    active={p.equipment.includes(e.id)}
                    onClick={() => set("equipment", p.equipment.includes(e.id) ? p.equipment.filter((x) => x !== e.id) : [...p.equipment, e.id])}
                  >
                    {e.label}
                  </Chip>
                ))}
              </div>
              <h3 className="mb-2 mt-6 text-[15px] font-semibold">Сколько минут на рецепт</h3>
              <div className="flex gap-2">
                {[20, 40, 60].map((m) => (
                  <Chip key={m} active={p.maxMinutes === m} onClick={() => set("maxMinutes", m)}>
                    до {m} мин
                  </Chip>
                ))}
              </div>
              <Next disabled={!p.equipment.length} onClick={next} />
            </Step>
          )}

          {step === 5 && (
            <Step title="Что вы любите готовить" lead="Эти блюда попадут в план первыми. Можно пропустить.">
              <textarea
                className="field min-h-32 py-3"
                placeholder="Например: курица с рисом, паста с фаршем, сырники"
                value={p.favorites}
                onChange={(e) => set("favorites", e.target.value)}
              />
              <Next onClick={next} />
            </Step>
          )}

          {step === 6 && (
            <Step title="Расписание" lead="Где вы едите и когда готовите. Потом можно поменять в профиле.">
              <div className="rounded-[20px] bg-card p-4 shadow-card">
                <ScheduleGrid value={schedule} onChange={setSchedule} />
              </div>
              <Next label="Собрать план" disabled={!schedule.cookDays.length} onClick={() => finish({ ...p, name: p.name || "Я" }, schedule)} />
            </Step>
          )}
        </main>
      </div>
    </AppShell>
  );
}

function Step({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="font-display text-[26px] font-extrabold leading-tight">{title}</h1>
      {lead && <p className="mb-5 mt-2 text-[15px] text-muted-foreground">{lead}</p>}
      {!lead && <div className="mb-5" />}
      {children}
    </div>
  );
}

function Next({ onClick, disabled, label = "Дальше" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <div className="mt-auto pb-8 pt-8">
      <button className="btn-primary w-full" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return (
    <li className="flex items-center gap-4 rounded-[20px] bg-card p-4 shadow-card">
      <Icon className="h-6 w-6 shrink-0 text-link" />
      <div>
        <p className="text-[15px] font-semibold leading-snug">{title}</p>
        <p className="text-[13px] text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}

function NumField({ label, value, onChange, suffix, step = 1 }: { label: string; value: number; onChange: (v: number) => void; suffix: string; step?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <input
          className="field pr-9"
          type="number"
          inputMode="decimal"
          step={step}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value.replace(",", ".")) || 0)}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </label>
  );
}

function Options<T extends string>({ value, options, onChange }: { value: T; options: { id: T; title: string; text: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-card px-4 shadow-card">
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          onClick={() => {
            tapLight();
            onChange(o.id);
          }}
          className={cn("flex w-full items-center gap-3 py-3.5 text-left active:scale-[0.99]", i > 0 && "border-t border-border")}
          aria-pressed={value === o.id}
        >
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", value === o.id ? "border-link" : "border-border")}>
            {value === o.id && <i className="h-2.5 w-2.5 rounded-full bg-link" />}
          </span>
          <span>
            <span className="block text-[15px] font-semibold">{o.title}</span>
            <span className="block text-[13px] text-muted-foreground">{o.text}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
