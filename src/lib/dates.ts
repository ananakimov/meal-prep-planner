export const DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const DOW_LONG = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

/** Monday-first index 0..6 */
export function dayIndex(s: string): number {
  return (parse(s).getDay() + 6) % 7;
}

export function monday(s: string): string {
  return addDays(s, -dayIndex(s));
}

export function human(s: string): string {
  const d = parse(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function today(): string {
  return ymd(new Date());
}
