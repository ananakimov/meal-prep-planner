import { ArrowLeft, CalendarDays, ChevronRight, ShoppingBasket, Sun, User, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";
import { tapLight } from "../lib/haptics";
import type { Macros, Recipe } from "../lib/types";

export function AppShell({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  return (
    <div className={cn("mx-auto min-h-screen w-full max-w-md bg-background", tabs ? "pb-28" : "pb-10")}>
      {children}
      {tabs && <TabBar />}
    </div>
  );
}

const TABS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Сегодня", icon: Sun },
  { to: "/week", label: "Неделя", icon: CalendarDays },
  { to: "/shop", label: "Покупки", icon: ShoppingBasket },
  { to: "/profile", label: "Профиль", icon: User },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 bg-card/95 backdrop-blur-md safe-bottom">
      <div className="flex items-center justify-between border-t border-border px-1.5 py-1.5">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            onClick={tapLight}
            className={({ isActive }) =>
              cn("flex flex-1 flex-col items-center gap-0.5 py-1.5", isActive ? "text-link" : "text-muted-foreground")
            }
          >
            {({ isActive }) => (
              <>
                <t.icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium">{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-start gap-2 px-4 pb-3 pt-6">
      <button
        onClick={() => {
          tapLight();
          navigate(-1);
        }}
        aria-label="Назад"
        className="flex h-10 w-10 shrink-0 items-center justify-center text-link active:scale-90"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <div className="min-w-0 flex-1 pt-2 text-left">
        <h1 className="line-clamp-2 font-display text-lg font-bold leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-link">{subtitle}</p>}
      </div>
      {right && <div className="flex min-h-10 shrink-0 items-center justify-end">{right}</div>}
    </header>
  );
}

export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-start gap-2 px-5 pb-1 pt-8">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-2xl font-extrabold leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="flex min-h-10 shrink-0 items-center justify-end">{right}</div>}
    </header>
  );
}

export function Block({ title, more, children, className }: { title?: string; more?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("px-5 pt-5", className)}>
      <div className="overflow-hidden rounded-[20px] bg-card p-4 shadow-card">
        {title && (
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[22px] font-bold text-foreground">{title}</h2>
            {more}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function Tile({ to, icon: Icon, title, text, tone }: { to: string; icon: LucideIcon; title: string; text: string; tone: "sky" | "lilac" | "rose" }) {
  return (
    <section className="px-5 pt-3">
      <Link
        to={to}
        onClick={tapLight}
        className="block overflow-hidden rounded-[1.75rem] p-5 shadow-card tappable-card"
        style={{ background: `hsl(var(--tile-${tone}))` }}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-soft">
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-bold leading-snug">{title}</h3>
            <p className="mt-1 text-xs text-foreground/70">{text}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-foreground/60" />
        </div>
      </Link>
    </section>
  );
}

export function Chip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        tapLight();
        onClick();
      }}
      className={cn(
        "h-9 shrink-0 rounded-full px-4 text-xs font-medium transition active:scale-90",
        active ? "bg-primary-soft font-semibold text-accent-foreground shadow-soft" : "bg-secondary text-foreground",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

const MACRO_META = [
  { key: "protein", label: "Б", color: "--c-sky" },
  { key: "fat", label: "Ж", color: "--c-amber" },
  { key: "carbs", label: "У", color: "--c-lime" },
] as const;

export function MacroLine({ m, className }: { m: Macros; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground", className)}>
      <span className="font-semibold text-foreground">{m.kcal} ккал</span>
      {MACRO_META.map((x) => (
        <span key={x.key} className="inline-flex items-center gap-1">
          <i className="h-2 w-2 rounded-full" style={{ background: `hsl(var(${x.color}))` }} />
          {x.label} {Math.round(m[x.key])}
        </span>
      ))}
    </span>
  );
}

/** Plan vs fact bars for the day */
export function MacroBars({ fact, target }: { fact: Macros; target: Macros }) {
  const rows = [
    { key: "kcal", label: "Калории", unit: "ккал", color: "--primary" },
    { key: "protein", label: "Белок", unit: "г", color: "--c-sky" },
    { key: "fat", label: "Жиры", unit: "г", color: "--c-amber" },
    { key: "carbs", label: "Углеводы", unit: "г", color: "--c-lime" },
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => {
        const f = Math.round(fact[r.key]);
        const t = Math.round(target[r.key]);
        const pct = t ? Math.min(100, (f / t) * 100) : 0;
        const over = f > t * 1.08;
        return (
          <div key={r.key}>
            <div className="mb-1 flex justify-between text-[13px]">
              <span className="font-medium">{r.label}</span>
              <span className={cn("tabular-nums", over ? "font-semibold text-destructive" : "text-muted-foreground")}>
                {f} / {t} {r.unit}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `hsl(var(${r.color}))` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RecipeCard({ r, to, label, macros }: { r: Recipe; to: string; label?: string; macros?: Macros }) {
  const m = macros ?? r.macros;
  return (
    <Link
      to={to}
      onClick={tapLight}
      className="flex aspect-square w-[44%] max-w-[160px] shrink-0 flex-col items-start justify-between rounded-[20px] bg-secondary p-3.5 tappable-card"
    >
      {label && (
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ background: "hsl(var(--c-sky) / 0.95)" }}>
          {label}
        </span>
      )}
      <div className="w-full">
        <p className="text-[11px] font-medium text-muted-foreground">{r.minutes} мин</p>
        <h3 className="mt-0.5 line-clamp-3 font-display text-[15px] font-bold leading-tight">{r.title}</h3>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {m.kcal} ккал · Б {m.protein}
        </p>
      </div>
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
