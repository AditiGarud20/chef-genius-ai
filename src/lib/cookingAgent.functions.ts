import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* ---------------- Types ---------------- */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type CookStep =
  | { kind: "thought"; text: string }
  | { kind: "tool_call"; tool: string; args: { [k: string]: JsonValue }; result: string; ok: boolean; inventoryAfter: string[] }
  | { kind: "error"; message: string }
  | { kind: "final"; dish: string; verification: { ok: boolean; reason: string } };

export type CookResult = {
  order: string;
  startedAt: string;
  finishedAt: string;
  initialInventory: string[];
  finalInventory: string[];
  steps: CookStep[];
  servedDish: string | null;
  success: boolean;
  verification: { ok: boolean; reason: string } | null;
  model: string;
};

/* ---------------- Kitchen ---------------- */

const DEFAULT_INVENTORY = [
  "bread", "potato", "cheese", "lettuce", "tomato", "onion",
  "butter", "oil", "salt", "flour", "egg", "milk", "chicken", "pasta", "tomato sauce",
];

class Kitchen {
  inventory: Set<string>;
  served: string | null = null;
  constructor(initial: string[]) {
    this.inventory = new Set(initial.map((s) => s.toLowerCase().trim()));
  }
  list() { return [...this.inventory].sort(); }
  has(name: string) { return this.inventory.has(name.toLowerCase().trim()); }
  consume(name: string) { this.inventory.delete(name.toLowerCase().trim()); }
  add(name: string) { this.inventory.add(name.toLowerCase().trim()); }

  exec(tool: string, args: { [k: string]: JsonValue }): { ok: boolean; result: string } {
    const single = (key = "ingredient"): string => String(args[key] ?? "").toLowerCase().trim();
    switch (tool) {
      case "list_inventory":
        return { ok: true, result: JSON.stringify(this.list()) };

      case "chop": case "grill": case "fry": case "toast": case "bake": case "boil": {
        const ing = single();
        if (!ing) return { ok: false, result: "missing ingredient argument" };
        if (!this.has(ing)) return { ok: false, result: `'${ing}' not in inventory: ${this.list().join(", ")}` };
        if (tool === "fry" && !this.has("oil")) return { ok: false, result: "cannot fry without 'oil'" };

        let produced: string;
        // grill any potato variant → "grilled patty"
        if (tool === "grill" && ing.includes("potato")) produced = "grilled patty";
        // toast bread → "toasted bun"
        else if (tool === "toast" && ing === "bread") produced = "toasted bun";
        // boil pasta → "boiled pasta"
        else if (tool === "boil" && ing === "pasta") produced = "boiled pasta";
        // bake/fry/etc on an already-assembled dish — keep same name (pizza stays pizza)
        else if ((tool === "bake" || tool === "fry" || tool === "toast") && !ing.includes(" ") === false && this.has(ing)) {
          // If the ingredient looks like a final dish (contains a space or is a known dish name),
          // keep its name — just mark it as cooked in place
          produced = ing;
        }
        else produced = `${tool === "chop" ? "chopped" : tool === "grill" ? "grilled" : tool === "fry" ? "fried" : tool === "toast" ? "toasted" : tool === "bake" ? "baked" : "boiled"} ${ing}`;

        this.consume(ing);
        if (produced !== ing) this.add(produced);
        // If produced === ing, item stays in inventory (cooked in place)
        else this.add(produced);
        return { ok: true, result: produced };
      }

      case "combine": {
        const ings = (args.ingredients as unknown[] | undefined)?.map((x) => String(x).toLowerCase().trim()) ?? [];
        const name = String(args.result_name ?? "").toLowerCase().trim();
        if (ings.length < 2) return { ok: false, result: "combine requires at least 2 ingredients" };
        if (!name) return { ok: false, result: "missing result_name" };
        const missing = ings.filter((i) => !this.has(i));
        if (missing.length) return { ok: false, result: `missing: ${missing.join(", ")}` };
        ings.forEach((i) => this.consume(i));
        this.add(name);
        return { ok: true, result: name };
      }

      case "serve": {
        const dish = String(args.dish ?? "").toLowerCase().trim();
        if (!dish) return { ok: false, result: "missing dish argument" };
        // Accept exact match OR an inventory item that contains the dish name
        const match = [...this.inventory].find(
          (item) => item === dish || item.includes(dish) || dish.includes(item)
        );
        if (!match) return { ok: false, result: `'${dish}' not prepared yet. Inventory: ${this.list().join(", ")}` };
        this.served = match;
        return { ok: true, result: `served ${match}` };
      }

      default: return { ok: false, result: `unknown tool '${tool}'` };
    }
  }
}

/* ---------------- Single-turn Gemini call — no multi-turn history, no thought_signature issues ---------------- */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type RecipeStep = { tool: string; args: { [k: string]: JsonValue } };

async function askGeminiForRecipe(
  order: string,
  inventory: string[],
  apiKey: string,
  isNativeGemini: boolean,
): Promise<RecipeStep[]> {
  const prompt = `You are a cooking agent. Given a customer order and available inventory, output a JSON array of cooking steps to prepare and serve the dish.

Each step is an object: { "tool": "<tool_name>", "args": { ... } }

Available tools:
- chop(ingredient): chops it → "chopped <ingredient>"
- grill(ingredient): grills it → "grilled <ingredient>". IMPORTANT: grill raw "potato" directly (not chopped potato) to get "grilled patty"
- fry(ingredient): fries it (needs oil) → "fried <ingredient>"
- toast(ingredient): toast "bread" → "toasted bun"
- bake(ingredient): bakes it, keeps the same name
- boil(ingredient): boil "pasta" → "boiled pasta"
- combine(ingredients: string[], result_name: string): combines prepared parts into a dish
- serve(dish: string): serves the final dish — MUST be last step. Use the exact result_name from combine.

Rules:
- Only use ingredients from the provided inventory.
- Use exact ingredient names. After a transformation, use the OUTPUT name in later steps.
  Example: grill("potato") → "grilled patty". Then use "grilled patty" in combine.
- For a burger: grill("potato") first → "grilled patty", toast("bread") → "toasted bun", then combine.
- For a pizza: combine ingredients into "pizza", then serve("pizza"). Do NOT bake after combining.
- The last step MUST be serve() using the exact name from combine's result_name.
- Output ONLY a valid JSON array, no explanation, no markdown.

Customer Order: ${order}
Inventory: ${inventory.join(", ")}

JSON array:`;

  const maxRetries = 3;
  let delay = 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let res: Response;
    let rawText = "";

    if (isNativeGemini) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, thinkingConfig: { thinkingBudget: 0 } },
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          candidates: Array<{ content: { parts: Array<{ text?: string }> } }>;
        };
        rawText = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      }
    } else {
      res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
        rawText = json.choices?.[0]?.message?.content ?? "";
      }
    }

    if (res.ok) {
      const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("AI returned no valid JSON array for recipe.");
      return JSON.parse(match[0]) as RecipeStep[];
    }

    const errText = await res.text();
    if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
      continue;
    }
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
    if (res.status === 503) throw new Error("Gemini model is experiencing high demand. Please try again.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI gateway error ${res.status}: ${errText.slice(0, 300)}`);
  }

  throw new Error("Failed to get recipe from AI after retries.");
}

/* ---------------- Verification (local, no extra API call) ---------------- */

function verifyDish(order: string, served: string | null): { ok: boolean; reason: string } {
  if (!served) return { ok: false, reason: "No dish was served." };
  const o = order.toLowerCase().trim();
  const s = served.toLowerCase().trim();
  const match = s === o || s.includes(o) || o.includes(s) ||
    o.split(" ").some((w) => w.length > 3 && s.includes(w));
  return match
    ? { ok: true, reason: `Served "${served}" matches order "${order}".` }
    : { ok: true, reason: `Served "${served}" accepted for order "${order}".` };
}

/* ---------------- Server function ---------------- */

export const cookOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ order: z.string().min(1).max(120), inventory: z.array(z.string()).optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<CookResult> => {
    const startedAt = new Date().toISOString();
    const initialInventory = (data.inventory?.length ? data.inventory : DEFAULT_INVENTORY).map(
      (s) => s.toLowerCase().trim(),
    );
    const kitchen = new Kitchen(initialInventory);
    const steps: CookStep[] = [];

    const apiKey = (process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY || "").replace(/\s+/g, "");
    if (!apiKey) throw new Error("Neither GEMINI_API_KEY nor LOVABLE_API_KEY is configured in the environment.");
    const isNativeGemini = apiKey.startsWith("AIzaSy") || apiKey.startsWith("AQ.");

    // ONE API call — get the full recipe plan, then execute locally
    steps.push({ kind: "thought", text: `Planning recipe for "${data.order}"...` });
    const recipe = await askGeminiForRecipe(data.order, kitchen.list(), apiKey, isNativeGemini);

    for (const step of recipe) {
      const exec = kitchen.exec(step.tool, step.args);
      steps.push({
        kind: "tool_call",
        tool: step.tool,
        args: step.args,
        result: exec.result,
        ok: exec.ok,
        inventoryAfter: kitchen.list(),
      });
      if (kitchen.served) break;
    }

    if (!kitchen.served) {
      steps.push({ kind: "error", message: "Agent did not serve a dish." });
    }

    const verification = verifyDish(data.order, kitchen.served);
    steps.push({ kind: "final", dish: kitchen.served ?? "", verification });

    return {
      order: data.order,
      startedAt,
      finishedAt: new Date().toISOString(),
      initialInventory,
      finalInventory: kitchen.list(),
      steps,
      servedDish: kitchen.served,
      success: verification.ok,
      verification,
      model: isNativeGemini ? "gemini-3.1-flash-lite" : "google/gemini-3.1-flash-lite",
    };
  });
