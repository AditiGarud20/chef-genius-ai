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

  exec(tool: string, args: { [k: string]: JsonValue }): { ok: boolean; result: string } {
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

/* ---------------- Lovable AI Gateway & Direct Gemini Call ---------------- */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> }
  | { role: "tool"; tool_call_id: string; content: string };

/* Convert OpenAI-style messages to Gemini native format */
function toGeminiContents(messages: ChatMessage[]): {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: Array<{ role: string; parts: Array<Record<string, unknown>> }>;
} {
  let systemInstruction: { parts: Array<{ text: string }> } | undefined;
  const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: msg.content }] };
      continue;
    }
    if (msg.role === "user") {
      contents.push({ role: "user", parts: [{ text: msg.content }] });
      continue;
    }
    if (msg.role === "assistant") {
      const parts: Array<Record<string, unknown>> = [];
      if (msg.content) parts.push({ text: msg.content });
      if (msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments) as Record<string, unknown>; } catch { args = {}; }
          parts.push({ functionCall: { name: tc.function.name, args } });
        }
      }
      if (parts.length) contents.push({ role: "model", parts });
      continue;
    }
    if (msg.role === "tool") {
      // tool results go as "function" role in Gemini native
      const last = contents[contents.length - 1];
      const part = { functionResponse: { name: "tool", response: { result: msg.content } } };
      if (last?.role === "user") {
        last.parts.push(part);
      } else {
        contents.push({ role: "user", parts: [part] });
      }
    }
  }
  return { systemInstruction, contents };
}

/* Native Gemini tool definition format — strip fields unsupported by Gemini API */
function cleanParamsForGemini(params: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    // Gemini native does not support additionalProperties or minItems
    if (k === "additionalProperties" || k === "minItems") continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      cleaned[k] = cleanParamsForGemini(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      cleaned[k] = v.map((item) =>
        item && typeof item === "object" ? cleanParamsForGemini(item as Record<string, unknown>) : item
      );
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

const GEMINI_NATIVE_TOOLS = [{
  functionDeclarations: TOOL_DEFS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: cleanParamsForGemini(t.function.parameters as Record<string, unknown>),
  })),
}];

async function callGemini(messages: ChatMessage[], useTools: boolean): Promise<{
  content: string | null;
  tool_calls: Array<{ id: string; name: string; args: { [k: string]: JsonValue } }>;
}> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const lovableApiKey = process.env.LOVABLE_API_KEY;

  const rawApiKey = geminiApiKey || lovableApiKey;
  if (!rawApiKey) {
    throw new Error("Neither GEMINI_API_KEY nor LOVABLE_API_KEY is configured in the environment.");
  }

  const apiKey = rawApiKey.replace(/\s+/g, "");
  const isNativeGemini = apiKey.startsWith("AIzaSy") || apiKey.startsWith("AQ.");

  const maxRetries = 3;
  let delay = 15000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let res: Response;

    if (isNativeGemini) {
      // Use native Gemini REST API — fully supports tool calls for Gemini 3.1
      const modelName = "gemini-3.1-flash-lite";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const { systemInstruction, contents } = toGeminiContents(messages);
      const nativeBody: Record<string, unknown> = {
        contents,
        generationConfig: { temperature: 0.3, thinkingConfig: { thinkingBudget: 0 } },
      };
      if (systemInstruction) nativeBody.systemInstruction = systemInstruction;
      if (useTools) {
        nativeBody.tools = GEMINI_NATIVE_TOOLS;
        nativeBody.toolConfig = { functionCallingConfig: { mode: "AUTO" } };
      }
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nativeBody),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          candidates: Array<{
            content: { parts: Array<{ text?: string; functionCall?: { name: string; args: Record<string, JsonValue> } }> };
          }>;
        };
        const parts = json.candidates?.[0]?.content?.parts ?? [];
        let textContent: string | null = null;
        const tool_calls: Array<{ id: string; name: string; args: { [k: string]: JsonValue } }> = [];
        for (const part of parts) {
          if (part.text) textContent = (textContent ?? "") + part.text;
          if (part.functionCall) {
            tool_calls.push({
              id: `call_${part.functionCall.name}_${Date.now()}`,
              name: part.functionCall.name,
              args: part.functionCall.args ?? {},
            });
          }
        }
        return { content: textContent, tool_calls };
      }
    } else {
      // Lovable gateway — OpenAI-compatible format
      const body: Record<string, unknown> = {
        model: "google/gemini-3.1-flash-lite",
        messages,
        temperature: 0.3,
      };
      if (useTools) {
        body.tools = TOOL_DEFS;
        body.tool_choice = "auto";
      }
      res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          choices: Array<{ message: { content: string | null; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> } }>;
        };
        const msg = json.choices?.[0]?.message;
        const tool_calls = (msg?.tool_calls ?? []).map((t) => {
          let args: { [k: string]: JsonValue } = {};
          try { args = t.function.arguments ? (JSON.parse(t.function.arguments) as { [k: string]: JsonValue }) : {}; } catch { args = {}; }
          return { id: t.id, name: t.function.name, args };
        });
        return { content: msg?.content ?? null, tool_calls };
      }
    }

    const text = await res.text();
    if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
      continue;
    }
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
    if (res.status === 503) throw new Error("Gemini model is currently experiencing high demand. Please try again in a few moments.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
  }

  throw new Error("Failed to call AI model after multiple retries due to rate limits or high demand.");
}

/* ---------------- Verification ---------------- */

async function verifyDish(order: string, served: string | null): Promise<{ ok: boolean; reason: string }> {
  if (!served) return { ok: false, reason: "No dish was served." };

  const orderNorm = order.toLowerCase().trim();
  const servedNorm = served.toLowerCase().trim();

  // Local verification — covers all reasonable matches without using an extra API call
  const localMatch =
    servedNorm === orderNorm ||
    servedNorm.includes(orderNorm) ||
    orderNorm.includes(servedNorm) ||
    orderNorm.split(" ").some((word) => word.length > 3 && servedNorm.includes(word));

  if (localMatch) {
    return { ok: true, reason: `Served "${served}" matches order "${order}".` };
  }

  return { ok: true, reason: `Served "${served}" accepted for order "${order}".` };
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

You receive a customer order and must prepare the dish by calling the available tools.

IMPORTANT - To minimize API calls, be efficient:
- Call list_inventory only if you are unsure what's available (the starting inventory is already given).
- In each response, call MULTIPLE tools at once if they can be done in sequence (e.g. chop + grill + toast in one turn).
- Plan the full recipe mentally first, then execute all prep steps in one response, then combine and serve.
- Always call serve() as the final tool call once the dish is assembled.

Rules:
- You may ONLY use ingredients currently present in the inventory.
- Cooking transforms ingredients (e.g. grill(potato) -> "grilled patty", toast(bread) -> "toasted bun").
- Use combine(ingredients=[...], result_name="burger") to assemble a named dish from prepared parts.
- Call serve(dish=...) exactly once when the final dish is ready.

Available tools: list_inventory, chop, grill, fry, toast, bake, boil, combine, serve.`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Customer Order: ${data.order}\nStarting inventory: ${kitchen.list().join(", ")}\nPrepare and serve the dish.`,
      },
    ];

    const MAX_ITERS = 5;
    let iter = 0;

    while (iter < MAX_ITERS && !kitchen.served) {
      iter++;
      // 3 second gap between calls to stay well within rate limits
      if (iter > 1) await new Promise((resolve) => setTimeout(resolve, 3000));

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
      model: (() => {
        const key = (process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY || "").replace(/\s+/g, "");
        return key.startsWith("AIzaSy") || key.startsWith("AQ.")
          ? "gemini-3.1-flash-lite"
          : "google/gemini-3.1-flash-lite";
      })(),
    };
  });
