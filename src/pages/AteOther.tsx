import { Send } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell, Chip, MacroLine, ScreenHeader } from "../components/ui";
import { errorText, estimateFood, mealFromHour, type FoodEstimate } from "../lib/claude";
import { cn } from "../lib/cn";
import { today } from "../lib/dates";
import { tapLight, tapMedium } from "../lib/haptics";
import type { LogEntry, MealKey } from "../lib/types";
import { useStore } from "../state/store";
import { MEAL_LABEL } from "./Today";

type Msg = { from: "user" | "bot"; text: string; estimate?: FoodEstimate; error?: boolean };

export default function AteOther() {
  const { state, setState } = useStore();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Что съели вместо плана или сверх него? Например: «вместо ужина шаурма» или «перекусил шоколадкой»." },
  ]);
  const [manual, setManual] = useState(!state.apiKey);
  const [m, setM] = useState({ name: "", kcal: "", meal: mealFromHour(new Date().getHours()) as MealKey, mode: "replace" as LogEntry["mode"] });

  const save = (e: Omit<LogEntry, "id">) => {
    tapMedium();
    const date = today();
    setState((s) => ({ ...s, log: { ...s.log, [date]: [...(s.log[date] ?? []), { ...e, id: crypto.randomUUID() }] } }));
    navigate("/", { replace: true });
  };

  const ask = async () => {
    const t = text.trim();
    if (!t || busy) return;
    tapLight();
    setMsgs((x) => [...x, { from: "user", text: t }]);
    setText("");
    setBusy(true);
    try {
      const est = await estimateFood(state.apiKey, t, new Date().getHours());
      setMsgs((x) => [...x, { from: "bot", text: est.comment, estimate: est }]);
    } catch (e) {
      setMsgs((x) => [...x, { from: "bot", text: errorText(e), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell tabs={false}>
      <ScreenHeader title="Съел другое" subtitle={manual ? "ручной ввод" : "ИИ посчитает КБЖУ"} />
      <div className="flex px-5">
        <div className="flex gap-2">
          <Chip active={!manual} onClick={() => setManual(false)}>
            Описать словами
          </Chip>
          <Chip active={manual} onClick={() => setManual(true)}>
            Ввести вручную
          </Chip>
        </div>
      </div>

      {!manual && (
        <section className="flex flex-col gap-3 px-5 pb-40 pt-5">
          {!state.apiKey && (
            <p className="rounded-2xl px-4 py-3 text-[13px] text-link" style={{ background: "hsl(var(--primary) / 0.08)" }}>
              Для оценки словами нужен ключ Claude API. <Link to="/profile" className="font-semibold underline">Добавить в профиле</Link>
            </p>
          )}
          {msgs.map((x, i) =>
            x.from === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-[16px] rounded-br-md bg-primary px-4 py-3 text-[15px] text-primary-foreground">
                {x.text}
              </div>
            ) : (
              <div key={i} className={cn("max-w-[85%] rounded-[16px] rounded-bl-md bg-card px-4 py-3 shadow-card", x.error && "text-destructive")}>
                {x.estimate ? (
                  <>
                    <p className="text-[15px] font-semibold">{x.estimate.name}</p>
                    <MacroLine m={x.estimate} className="mt-1" />
                    <p className="mt-2 text-[13px] text-muted-foreground">{x.text}</p>
                    <button
                      className="mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold text-link active:scale-[0.99]"
                      style={{ background: "hsl(var(--primary) / 0.08)" }}
                      onClick={() =>
                        save({
                          meal: x.estimate!.meal,
                          mode: x.estimate!.mode,
                          text: msgs[i - 1]?.text ?? "",
                          name: x.estimate!.name,
                          macros: { kcal: x.estimate!.kcal, protein: x.estimate!.protein, fat: x.estimate!.fat, carbs: x.estimate!.carbs },
                        })
                      }
                    >
                      {x.estimate.mode === "replace" ? `Записать вместо: ${MEAL_LABEL[x.estimate.meal].toLowerCase()}` : `Добавить к: ${MEAL_LABEL[x.estimate.meal].toLowerCase()}`}
                      <span aria-hidden>›</span>
                    </button>
                  </>
                ) : (
                  <p className="text-[15px] leading-snug">{x.text}</p>
                )}
              </div>
            ),
          )}
          {busy && <div className="max-w-[85%] rounded-[16px] rounded-bl-md bg-card px-4 py-3 text-[15px] text-muted-foreground shadow-card">Считаю…</div>}
          <form
            className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 gap-2 border-t border-border bg-card/95 px-4 pt-3 backdrop-blur-md safe-bottom"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <input className="field" placeholder="Вместо ужина шаурма…" value={text} onChange={(e) => setText(e.target.value)} disabled={!state.apiKey} />
            <button className="btn-primary h-12 w-12 shrink-0 px-0" disabled={!text.trim() || busy || !state.apiKey} aria-label="Отправить">
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}

      {manual && (
        <section className="px-5 pt-5">
          <div className="flex flex-col gap-4 rounded-[20px] bg-card p-4 shadow-card">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-muted-foreground">Что съели</span>
              <input className="field" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="Шаурма" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-muted-foreground">Калории</span>
              <input className="field" inputMode="numeric" value={m.kcal} onChange={(e) => setM({ ...m, kcal: e.target.value })} placeholder="650" />
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(MEAL_LABEL) as MealKey[]).map((k) => (
                <Chip key={k} active={m.meal === k} onClick={() => setM({ ...m, meal: k })}>
                  {MEAL_LABEL[k]}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <Chip active={m.mode === "replace"} onClick={() => setM({ ...m, mode: "replace" })}>
                Вместо плана
              </Chip>
              <Chip active={m.mode === "add"} onClick={() => setM({ ...m, mode: "add" })}>
                Сверх плана
              </Chip>
            </div>
            <button
              className="btn-primary w-full"
              disabled={!m.name.trim() || !(Number(m.kcal) > 0)}
              onClick={() => {
                const kcal = Number(m.kcal);
                // without macros, assume a typical mixed meal: 20% protein, 35% fat, 45% carbs
                save({
                  meal: m.meal,
                  mode: m.mode,
                  text: m.name,
                  name: m.name.trim(),
                  macros: { kcal, protein: Math.round((kcal * 0.2) / 4), fat: Math.round((kcal * 0.35) / 9), carbs: Math.round((kcal * 0.45) / 4) },
                })
              }}
            >
              Записать
            </button>
          </div>
        </section>
      )}
    </AppShell>
  );
}
