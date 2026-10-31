import { CalendarDays, Download, KeyRound, RotateCcw, Scale, Upload, UserPen } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Block, MacroLine, TabHeader } from "../components/ui";
import { addDays, human, today } from "../lib/dates";
import { tapLight, tapMedium } from "../lib/haptics";
import { GOAL, explain } from "../lib/nutrition";
import { EMPTY, clear, exportJson, importJson } from "../lib/storage";
import { useStore } from "../state/store";

export default function Profile() {
  const { state, setState, targets } = useStore();
  const [kg, setKg] = useState("");
  const [key, setKey] = useState(state.apiKey);
  const [msg, setMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const p = state.profile;
  if (!p || !targets) return null;

  const t = today();
  const lastWeek = state.weights.filter((w) => w.date > addDays(t, -7));
  const prevWeek = state.weights.filter((w) => w.date <= addDays(t, -7) && w.date > addDays(t, -14));
  const avg = (l: typeof lastWeek) => (l.length ? l.reduce((s, w) => s + w.kg, 0) / l.length : null);
  const a1 = avg(lastWeek);
  const a0 = avg(prevWeek);

  const addWeight = () => {
    const v = Number(kg.replace(",", "."));
    if (!(v > 30 && v < 300)) return;
    tapMedium();
    setState((s) => ({ ...s, weights: [...s.weights.filter((w) => w.date !== t), { date: t, kg: v }].sort((a, b) => a.date.localeCompare(b.date)) }));
    setKg("");
  };

  const download = () => {
    const blob = new Blob([exportJson(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `meal-prep-planner-${t}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File) => {
    try {
      const next = importJson(await file.text());
      setState(() => ({ ...next, apiKey: state.apiKey }));
      setMsg("Данные загружены");
    } catch {
      setMsg("Не получилось прочитать файл");
    }
  };

  return (
    <AppShell>
      <TabHeader title="Профиль" subtitle={`${GOAL[p.goal].label} · ${p.weight} кг · ${p.height} см · ${p.age} лет`} />

      <Block title="Норма в день">
        <MacroLine m={targets} className="text-sm" />
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-link">Как посчитано</summary>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[14px] leading-snug">
            {explain(p, targets).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
        </details>
      </Block>

      <Block title="Вес">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addWeight();
          }}
        >
          <input className="field" inputMode="decimal" placeholder={`Сегодня, кг`} value={kg} onChange={(e) => setKg(e.target.value)} />
          <button className="btn-primary shrink-0 px-5" type="submit">
            <Scale className="h-5 w-5" /> Записать
          </button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <Stat label="Средний за 7 дней" value={a1 ? `${a1.toFixed(1).replace(".", ",")} кг` : "—"} />
          <Stat
            label="За неделю"
            value={a1 && a0 ? `${a1 - a0 > 0 ? "+" : ""}${(a1 - a0).toFixed(1).replace(".", ",")} кг` : "—"}
          />
        </div>
        <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
          Взвешивайтесь утром натощак. Худеете быстрее 0,7 кг в неделю — добавьте еды; вес стоит 2 недели — уберите 150 ккал.
        </p>
        {state.weights.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Последняя запись: {human(state.weights[state.weights.length - 1].date)}, {state.weights[state.weights.length - 1].kg} кг
          </p>
        )}
      </Block>

      <Block title="Настройки">
        <div className="-mx-4 overflow-hidden px-4">
          <Action to="/schedule" icon={CalendarDays} label="Расписание и дни готовки" first />
          <Action to="/onboarding" icon={UserPen} label="Изменить данные и ограничения" />
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <label className="flex items-center gap-2 text-[15px] font-semibold">
            <KeyRound className="h-5 w-5 text-link" /> Ключ Claude API
          </label>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
            Нужен для «Съел другое»: ИИ оценивает КБЖУ по описанию. Ключ хранится только в этом браузере и уходит только в Anthropic.
          </p>
          <div className="mt-2 flex gap-2">
            <input className="field" type="password" autoComplete="off" placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} />
            <button
              className="btn-secondary shrink-0 px-5"
              onClick={() => {
                tapLight();
                setState((s) => ({ ...s, apiKey: key.trim() }));
                setMsg(key.trim() ? "Ключ сохранён" : "Ключ удалён");
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <button className="btn-secondary h-10 px-4 text-sm" onClick={download}>
            <Download className="h-4 w-4" /> Экспорт
          </button>
          <button className="btn-secondary h-10 px-4 text-sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Импорт
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button
            className="btn-secondary h-10 px-4 text-sm text-destructive"
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true);
              clear();
              setState(() => EMPTY);
            }}
          >
            <RotateCcw className="h-4 w-4" /> {confirmReset ? "Точно стереть всё?" : "Начать заново"}
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-link">{msg}</p>}
      </Block>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-3 py-3">
      <p className="font-display text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Action({ to, icon: Icon, label, first }: { to: string; icon: typeof Scale; label: string; first?: boolean }) {
  return (
    <Link to={to} onClick={tapLight} className={first ? "flex items-center gap-4 py-3.5" : "ml-10 flex items-center gap-4 border-t border-border py-3.5"}>
      <Icon className={first ? "h-6 w-6 shrink-0 text-link" : "-ml-10 h-6 w-6 shrink-0 text-link"} />
      <span className="text-[15px] font-semibold">{label}</span>
    </Link>
  );
}
