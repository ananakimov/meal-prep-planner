import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { MealKey } from "./types";

/** What the model returns for one "ate something else" message */
const FoodEstimate = z.object({
  name: z.string().describe("Short name of what was eaten, in Russian"),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]).describe("Which meal it belongs to"),
  mode: z.enum(["replace", "add"]).describe("replace = eaten instead of the planned meal, add = on top of the plan"),
  kcal: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  comment: z.string().describe("One short sentence in Russian: what portion was assumed"),
});

export type FoodEstimate = z.infer<typeof FoodEstimate>;

const SYSTEM = `Ты оцениваешь калорийность еды по описанию для приложения-планировщика питания.
Пользователь ест по плану; ты получаешь только то, что он съел вместо плана или сверх него.
Оценивай типичную порцию из российских кафе и магазинов, если размер не указан, и назови её в comment.
Если сказано «вместо обеда/ужина/завтрака» — mode replace и этот приём пищи. Если «ещё», «плюс», «перекусил» — mode add.
Если приём пищи не назван, выбери по смыслу и подсказке о текущем времени.
Числа — граммы и ккал на всю съеденную порцию, округлённые до целых.`;

export class NoKeyError extends Error {}

export async function estimateFood(apiKey: string, text: string, hourNow: number): Promise<FoodEstimate> {
  if (!apiKey) throw new NoKeyError("Нет ключа API");
  // The key is the user's own and never leaves their browser except to Anthropic
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Сейчас ${hourNow}:00. ${text}` }],
    output_config: { effort: "low", format: zodOutputFormat(FoodEstimate) },
  });
  if (response.stop_reason === "refusal") throw new Error("Модель отказалась отвечать на этот запрос");
  if (!response.parsed_output) throw new Error("Не получилось разобрать ответ");
  return response.parsed_output;
}

export function mealFromHour(h: number): MealKey {
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function errorText(e: unknown): string {
  if (e instanceof NoKeyError) return "Добавьте ключ Claude API в профиле — или внесите калории вручную.";
  if (e instanceof Anthropic.AuthenticationError) return "Ключ не подошёл. Проверьте его в профиле.";
  if (e instanceof Anthropic.RateLimitError) return "Слишком много запросов, попробуйте через минуту.";
  if (e instanceof Anthropic.APIConnectionError) return "Нет связи с сервером. Проверьте интернет.";
  if (e instanceof Anthropic.APIError) return `Ошибка API: ${e.message}`;
  return e instanceof Error ? e.message : "Что-то пошло не так";
}
