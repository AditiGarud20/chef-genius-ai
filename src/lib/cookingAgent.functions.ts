import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* ---------------- Types ---------------- */

export type CookStep =
  | { kind: "thought"; text: string }
  | { kind: "tool_call"; tool: string; args: Record<string, unknown>; result: string; ok: boolean; inventoryAfter: string[] }
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

/* ---------------- Tool definitions for Gemini ---------------- */

const TOOL_DEFS = [
  {
    type: "function",
    function: {
      name: "list_inventory",
      description: "Returns the list of currently available ingredients in the kitchen.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "chop",
      description: "Chop an ingredient. Consumes the ingredient and produces 'chopped <ingredient>'.",
      parameters: {
        type: "object",
        properties: { ingredient: { type: "string", description: "Ingredient to chop" } },
        required: ["ingredient"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "grill",
      description: "Grill an ingredient. Potato becomes 'grilled patty'; other items become 'grilled <ingredient>'.",
      parameters: {
        type: "object",
        properties: { ingredient: { type: "string" } },
        required: ["ingredient"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fry",
      description: "Fry an ingredient (requires oil in inventory).",
      parameters: {
        type: "object",
        properties: { ingredient: { type: "string" } },
        required: ["ingredient"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "toast",
      description: "Toast an ingredient. Bread becomes 'toasted bun'.",
      parameters: {
        type: "object",
        properties: { ingredient: { type: "string" } },
        required: ["ingredient"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bake",
      description: "Bake an ingredient or mixture.",
      parameters: {
        type: "object",
        properties: { ingredient: { type: "string" } },
        required: ["ingredient"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "boil",
      description: "Boil an ingredient.",
      parameters: {
        type: "object",
        properties: { ingredient: { type: "string" } },
        required: ["ingredient"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "combine",
      description: "Combine 2+ ingredients into a named dish (e.g. burger, pizza, sandwich, pasta).",
      parameters: {
        type: "object",
        properties: {
          ingredients: { type: "array", items: { type: "string" }, minItems: 2 },
          result_name: { type: "string", description: "Name of resulting dish, e.g. 'burger'" },
        },
        required: ["ingredients", "result_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "serve",
      description: "Serve the final prepared dish. Ends the cooking workflow.",
      parameters: {
        type: "object",
        properties: { dish: { type: "string" } },
        required: ["dish"],
      },
    },
  },
] as const;

/* ---------------- Kitchen execution ---------------- */

const DEFAULT_INVENTORY = [
  "bread",
  "potato",
  "cheese",
  "lettuce",
  "tomato",
  "onion",
  "butter",
  "oil",
  "salt",
  "flour",
  "egg",
  "milk",
  "chicken",
  "pasta",
  "tomato sauce",
];

class Kitchen {
  inventory: Set<string>;
  served: string | null = null;
  constructor(initial: string[]) {
    this.inventory = new Set(initial.map((s) => s.toLowerCase().trim()));
  }
  list() {
    return [...this.inventory].sort();
  }
  has(name: string) {
    return this.inventory.has(name.toLowerCase().trim());
  }
  consume(name: string) {
    this.inventory.delete(name.toLowerCase().trim());
  }
  add(name: string) {
    this.inventory.add(name.toLowerCase().trim());
  }

  exec(tool: string, args: Record<string, unknown>): { ok: boolean; result: string } {
    const single = (key = "ingredient"): string => String(args[key] ?? "").toLowerCase().trim();

    switch (tool) {
      case "list_inventory":
        return { ok: true, result: JSON.stringify(this.list()) };

      case "chop":
      case "grill":
      case "fry":
      case "toast":
      case "bake":
      case "boil": {
        const ing = single();
        if (!ing) return { ok: false, result: "missing ingredient argument" };
        if (!this.has(ing)) return { ok: false, result: `'${ing}' is not in inventory: ${this.list().join(", ")}` };
        if (tool === "fry" && !this.has("oil")) return { ok: false, result: "cannot fry without 'oil' in inventory" };

        let produced: string;
        if (tool === "grill" && ing === "potato") produced = "grilled patty";
        else if (tool === "toast" && ing === "bread") produced = "toasted bun";
        else if (tool === "boil" && ing === "pasta") produced = "boiled pasta";
        else produced = `${tool === "chop" ? "chopped" : tool === "grill" ? "grilled" : tool === "fry" ? "fried" : tool === "toast" ? "toasted" : tool === "bake" ? "baked" : "boiled"} ${ing}`;

        this.consume(ing);
        this.add(produced);
        return { ok: true, result: produced };
      }

      case "combine": {
        const ings = (args.ingredients as unknown[] | undefined)?.map((x) => String(x).toLowerCase().trim()) ?? [];
        const name = String(args.result_name ?? "").toLowerCase().trim();
        if (ings.length < 2) return { ok: false, result: "combine requires at least 2 ingredients" };
        if (!name) return { ok: false, result: "missing result_name" };
        const missing = ings.filter((i) => !this.has(i));
        if (missing.length) return { ok: false, result: `missing ingredients: ${missing.join(", ")}` };
        ings.forEach((i) => this.consume(i));
        this.add(name);
        return { ok: true, result: name };
      }

      case "serve": {
        const dish = String(args.dish ?? "").toLowerCase().trim();
        if (!dish) return { ok: false, result: "missing dish argument" };
        if (!this.has(dish)) return { ok: false, result: `'${dish}' not prepared yet` };
        this.served = dish;
        return { ok: true, result: `served ${dish}` };
      }

      default:
        return { ok: false, result: `unknown tool '${tool}'` };
    }
  }
}

/* ---------------- Lovable AI Gateway call ---------------- */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> }
  | { role: "tool"; tool_call_id: string; content: string };

async function callGemini(messages: ChatMessage[], useTools: boolean): Promise<{
  content: string | null;
  tool_calls: Array<{ id: string; name: string; args: Record<string, unknown> }>;
}> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.3,
  };
  if (useTools) {
    body.tools = TOOL_DEFS;
    body.tool_choice = "auto";
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
      };
    }>;
  };

  const msg = json.choices?.[0]?.message;
  const calls = (msg?.tool_calls ?? []).map((t) => {
    let args: Record<string, unknown> = {};
    try {
      args = t.function.arguments ? JSON.parse(t.function.arguments) : {};
    } catch {
      args = {};
    }
    return { id: t.id, name: t.function.name, args };
  });
  return { content: msg?.content ?? null, tool_calls: calls };
}

/* ---------------- Verification ---------------- */

async function verifyDish(order: string, served: string | null): Promise<{ ok: boolean; reason: string }> {
  if (!served) return { ok: false, reason: "No dish was served." };

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You verify whether a served dish satisfies a customer order. Allow semantic matches (e.g. 'cheeseburger' satisfies 'burger', 'veg burger' satisfies 'burger', 'margherita pizza' satisfies 'pizza'). Reply ONLY with strict JSON: {\"ok\": boolean, \"reason\": string}.",
    },
    {
      role: "user",
      content: `Customer Order: ${order}\nServed Dish: ${served}\nDoes the served dish satisfy the order?`,
    },
  ];

  try {
    const { content } = await callGemini(messages, false);
    const match = content?.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false, reason: "Verifier returned no JSON." };
    const parsed = JSON.parse(match[0]) as { ok: boolean; reason: string };
    return { ok: !!parsed.ok, reason: String(parsed.reason ?? "") };
  } catch (e) {
    return { ok: false, reason: `Verifier error: ${(e as Error).message}` };
  }
}

/* ---------------- Server function ---------------- */

export const cookOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        order: z.string().min(1).max(120),
        inventory: z.array(z.string()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CookResult> => {
    const startedAt = new Date().toISOString();
    const initialInventory = (data.inventory && data.inventory.length ? data.inventory : DEFAULT_INVENTORY).map(
      (s) => s.toLowerCase().trim(),
    );
    const kitchen = new Kitchen(initialInventory);
    const steps: CookStep[] = [];

    const systemPrompt = `You are ChefGenius, an autonomous AI cooking agent in a virtual kitchen.

You receive a customer order and must prepare the dish autonomously by calling the available tools.

Rules:
- You may ONLY use ingredients currently present in the inventory. Call list_inventory if unsure.
- Use tools step by step: chop, grill, fry, toast, bake, boil, combine, serve.
- Cooking transforms ingredients (e.g. grill(potato) -> "grilled patty", toast(bread) -> "toasted bun").
- Use combine(ingredients=[...], result_name="burger") to assemble a named dish from prepared parts.
- When the final dish is ready, call serve(dish=...) exactly once and then stop.
- Think briefly between actions in your text content, but always make progress by calling a tool.
- Do not hardcode; reason from the available ingredients.

Available tools: list_inventory, chop, grill, fry, toast, bake, boil, combine, serve.`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Customer Order: ${data.order}\nStarting inventory: ${kitchen.list().join(", ")}\nPrepare and serve the dish.`,
      },
    ];

    const MAX_ITERS = 12;
    let iter = 0;

    while (iter < MAX_ITERS && !kitchen.served) {
      iter++;
      const { content, tool_calls } = await callGemini(messages, true);

      if (content && content.trim()) {
        steps.push({ kind: "thought", text: content.trim() });
      }

      if (!tool_calls.length) {
        steps.push({ kind: "error", message: "Agent stopped without calling a tool." });
        messages.push({
          role: "assistant",
          content: content ?? "",
        });
        messages.push({
          role: "user",
          content: "You must continue by calling a tool. The dish has not been served yet.",
        });
        continue;
      }

      messages.push({
        role: "assistant",
        content: content,
        tool_calls: tool_calls.map((c) => ({
          id: c.id,
          type: "function" as const,
          function: { name: c.name, arguments: JSON.stringify(c.args) },
        })),
      });

      for (const call of tool_calls) {
        const exec = kitchen.exec(call.name, call.args);
        steps.push({
          kind: "tool_call",
          tool: call.name,
          args: call.args,
          result: exec.result,
          ok: exec.ok,
          inventoryAfter: kitchen.list(),
        });
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: exec.ok ? exec.result : `ERROR: ${exec.result}`,
        });
        if (kitchen.served) break;
      }
    }

    if (!kitchen.served) {
      steps.push({ kind: "error", message: `Agent did not serve a dish within ${MAX_ITERS} iterations.` });
    }

    const verification = await verifyDish(data.order, kitchen.served);
    steps.push({
      kind: "final",
      dish: kitchen.served ?? "",
      verification,
    });

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
      model: MODEL,
    };
  });
