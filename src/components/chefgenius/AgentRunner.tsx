import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { cookOrder, type CookResult, type CookStep } from "@/lib/cookingAgent.functions";

const SUGGESTIONS = ["Burger", "Cheeseburger", "Pizza", "Sandwich", "Pasta", "Veg Burger"];

export function AgentRunner() {
  const run = useServerFn(cookOrder);
  const [order, setOrder] = useState("Burger");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CookResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await run({ data: { order } });
      setResult(res as CookResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="agent" className="relative py-32">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-foreground/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Live Gemini Agent
          </div>
          <h2 className="mt-6 font-display text-5xl font-semibold leading-tight md:text-7xl">
            Place a real order. <span className="italic gradient-text">Watch Gemini cook.</span>
          </h2>
          <p className="mt-4 text-lg text-foreground/65">
            Powered by Gemini with autonomous tool calling, inventory tracking, and semantic dish verification — all running on the backend.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Order panel */}
          <div className="glass rounded-3xl p-8 lg:col-span-5">
            <label className="text-xs font-medium uppercase tracking-widest text-foreground/50">Customer Order</label>
            <input
              type="text"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              disabled={loading}
              className="mt-3 w-full rounded-2xl border border-foreground/10 bg-white/80 px-5 py-4 font-display text-2xl outline-none focus:border-primary"
              placeholder="e.g. Burger"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOrder(s)}
                  disabled={loading}
                  className="rounded-full border border-foreground/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleRun}
              disabled={loading || !order.trim()}
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground shadow-[0_15px_40px_-10px_rgba(255,90,54,0.5)] transition hover:shadow-[0_25px_60px_-10px_rgba(255,90,54,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-foreground" />
                  Agent cooking…
                </>
              ) : (
                <>Run Cooking Agent →</>
              )}
            </button>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-white/70 p-4">
                  <div className="text-xs uppercase tracking-widest text-foreground/50">Final Inventory</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.finalInventory.map((i) => (
                      <span key={i} className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs">{i}</span>
                    ))}
                  </div>
                </div>
                <div
                  className={`rounded-2xl p-4 ${
                    result.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <div className="text-xs font-medium uppercase tracking-widest opacity-80">
                    Verification · {result.success ? "SUCCESS" : "FAILED"}
                  </div>
                  <div className="mt-1 font-display text-xl font-semibold">
                    Served: {result.servedDish ?? "—"}
                  </div>
                  <div className="mt-1 text-sm opacity-80">{result.verification?.reason}</div>
                </div>
              </div>
            )}
          </div>

          {/* Trace panel */}
          <div className="glass-dark relative overflow-hidden rounded-3xl text-background lg:col-span-7">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="font-mono text-xs text-background/60">
                agent.run(order=&quot;{order}&quot;)
              </div>
              <div className="text-[10px] uppercase tracking-widest text-background/40">
                {result?.model ?? "gemini-2.5-flash"}
              </div>
            </div>

            <div className="max-h-[640px] min-h-[400px] space-y-2 overflow-y-auto p-6 font-mono text-sm">
              {!result && !loading && (
                <div className="text-background/50">› awaiting order…</div>
              )}
              {loading && (
                <div className="space-y-2">
                  <div className="text-background/70">› parsing order…</div>
                  <div className="text-background/70">› contacting Gemini…</div>
                  <div className="text-primary">● agent reasoning, this may take 10–30s</div>
                </div>
              )}
              <AnimatePresence>
                {result?.steps.map((step, i) => (
                  <StepRow key={i} step={step} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepRow({ step, index }: { step: CookStep; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      {step.kind === "thought" && (
        <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-background/70">
          <span className="text-background/40">💭 </span>
          {step.text}
        </div>
      )}
      {step.kind === "tool_call" && (
        <div
          className={`rounded-lg border px-3 py-2 ${
            step.ok ? "border-success/30 bg-success/10" : "border-destructive/40 bg-destructive/10"
          }`}
        >
          <div>
            <span className="text-primary">{step.tool}</span>
            <span className="text-background/50">(</span>
            <span className="text-warning">
              {Object.entries(step.args)
                .map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.join(", ")}]` : JSON.stringify(v)}`)
                .join(", ")}
            </span>
            <span className="text-background/50">)</span>
          </div>
          <div className={`mt-1 text-xs ${step.ok ? "text-success" : "text-destructive"}`}>
            → {step.result}
          </div>
        </div>
      )}
      {step.kind === "error" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
          ⚠ {step.message}
        </div>
      )}
      {step.kind === "final" && (
        <div
          className={`mt-3 rounded-lg border px-3 py-3 ${
            step.verification.ok ? "border-success/40 bg-success/15 text-success" : "border-destructive/40 bg-destructive/15 text-destructive"
          }`}
        >
          <div className="font-medium">
            {step.verification.ok ? "✓ Verification: SUCCESS" : "✗ Verification: FAILED"}
          </div>
          <div className="mt-0.5 text-xs opacity-80">
            served: {step.dish || "—"} · {step.verification.reason}
          </div>
        </div>
      )}
    </motion.div>
  );
}
