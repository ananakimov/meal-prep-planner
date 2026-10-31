---
name: meal-prep-cart
description: Plan a week of home cooking under the user's calorie target and constraints, then build a VkusVill grocery cart for it through the VkusVill MCP. Use when the user asks to plan meals for the week, build a grocery cart, «собери корзину», «план питания на неделю», or attaches an export file from Meal-prep planner.
---

# Meal-prep cart

You plan a week of food for someone who cooks 1–2 times a week and orders groceries online, then build a VkusVill cart with the VkusVill MCP. Speak Russian with the user.

The product idea behind it: planning is the hard part, not cooking. Ask only what changes the plan, then hand back a plan, quantities and one cart link.

## 1. Get the inputs

If the user attached an export from the Meal-prep planner app (`meal-prep-planner-YYYY-MM-DD.json`), read `profile` and `schedule` from it and skip to step 2. Never print the file back.

Otherwise ask in one short message (offer buttons/options where your client supports them):

- sex, age, height, weight, activity (sedentary / 1–3 workouts / 3–5 workouts or 10k steps), goal (lose / recomposition / gain);
- what they don't eat and allergies — **ask, never assume**;
- kitchen equipment (pan, pot, oven, multicooker) and the most minutes they'll spend on one recipe;
- which days they cook and which meals they eat out (office lunches, evenings out, weekends);
- dishes they already cook or love;
- weekly budget, if any.

## 2. Compute the target

Mifflin–St Jeor, then explain each step in one line:

1. BMR = 10 × kg + 6.25 × cm − 5 × age + 5 (men) / − 161 (women).
2. × 1.2 / 1.375 / 1.55 by activity.
3. Goal: −15% lose, −12% recomposition, +10% gain.
4. Protein 1.8–2 g/kg, fat ~0.85 g/kg, the rest carbs, fiber ~30 g.

Say it's an estimate and to re-check by the 7-day average weight after 2 weeks.

## 3. Plan the week

- **Batches:** each cook day makes 4 portions — lunch and dinner for that day and the next. Days whose meals are out get nothing.
- **Breakfasts** rotate in blocks of 2 days, so a batch breakfast (сырники, a spread) is made once for two mornings.
- **Recipes:** start from the user's own dishes. For variety, search `vkusvill_recipes` with filters — call it once with `page: 1` to get the filter ids, then filter by cooking method «На сковороде», time «до 40 минут», «Много белка», excluded allergens. Recipes there carry KБЖУ per 100 g and `products_id` — use those ids for the cart.
- **Portions:** hit the target ±100 kcal per day by changing the garnish (rice, pasta, potatoes) first, then the whole portion within 70–140%.
- **Fiber:** if a day is under ~25 g, add beans to the salad, a vegetable mix, or a fruit — not a supplement.
- **Snack:** творог 5% with a spoon of honey works for most people who eat dairy; otherwise fruit and nuts.

Show the plan as a compact table: day × breakfast / lunch / dinner, plus kcal and protein per day.

## 4. Build the cart

- Search each product with `vkusvill_products_search` (`mode: "custom"`, `fields: ["id","name","price","weight","unit"]`, `limit: 5`). Prefer VkusVill's own brand; for weighed goods (vegetables, chicken) the quantity `q` is in kg.
- Check a product with `vkusvill_product_details` when its pack size or composition matters (tortillas per pack, whether a «сыр» is processed).
- **Two carts, not one:** raw meat or fish for a cook day later in the week goes in a second cart to order the day before — it keeps 1–2 days.
- **Leave out** what people pick better themselves (fruit — the user may say so) and pantry items (oil, spices, honey) unless the user asks.
- Make each link with `vkusvill_cart_link_create` (`products: [{id, q}]`).
- Sum the prices, compare with the budget, and if it's over, offer concrete swaps with their savings (e.g. «фарш говядина+свинина вместо говяжьего — −60 ₽, но жирнее»).

## 5. Hand over

One message: the target in one line, the week table, how much to put in each portion, both cart links with totals, and what's not in the cart (fruit, pantry). Offer to adjust: swap a dish, change cook days, change the budget.

## Rules

- Never invent KБЖУ or prices: take them from the MCP results or say it's an estimate.
- A user correction («я не ем каши», «духовки нет») overrides everything above — rebuild the affected part, don't argue.
- Keep recipes within the user's time limit end to end, including boiling water.
- No brand logos or claims on VkusVill's behalf; you're a user of its public MCP.
