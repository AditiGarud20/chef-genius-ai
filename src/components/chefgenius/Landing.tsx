import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useInView, type Variants } from "framer-motion";
import { AgentRunner } from "./AgentRunner";


/* ---------- Shared bits ---------- */

const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-7xl px-6 md:px-10 ${className}`}>{children}</div>
);

const SectionEyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-foreground/70 backdrop-blur">
    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
    {children}
  </div>
);

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: i * 0.08 },
  }),
};

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Nav ---------- */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-6"}`}
    >
      <Container>
        <div className={`flex items-center justify-between rounded-full px-5 py-3 transition-all ${scrolled ? "glass" : ""}`}>
          <a href="#top" className="flex items-center gap-2">
            <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
              <span className="font-display text-lg leading-none">C</span>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">ChefGenius</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">AI</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-foreground/70 md:flex">
            <a className="hover:text-foreground" href="#about">Overview</a>
            <a className="hover:text-foreground" href="#kitchen">Kitchen</a>
            <a className="hover:text-foreground" href="#simulation">Simulation</a>
            <a className="hover:text-foreground" href="#tech">Technology</a>
          </nav>
          <a href="#simulation" className="hidden items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:scale-105 md:inline-flex">
            Launch Agent
            <span aria-hidden>→</span>
          </a>
        </div>
      </Container>
    </motion.header>
  );
}

/* ---------- Hero ---------- */

const FLOATING_INGREDIENTS = [
  { emoji: "🍞", label: "Bread", x: "10%", y: "12%", delay: 0 },
  { emoji: "🥔", label: "Potato", x: "78%", y: "8%", delay: 0.3 },
  { emoji: "🧀", label: "Cheese", x: "5%", y: "65%", delay: 0.6 },
  { emoji: "🥬", label: "Lettuce", x: "82%", y: "70%", delay: 0.9 },
  { emoji: "🍅", label: "Tomato", x: "45%", y: "85%", delay: 1.2 },
];

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative min-h-screen overflow-hidden pt-32">
      {/* background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-20 h-[480px] w-[480px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute right-0 top-40 h-[420px] w-[420px] rounded-full bg-secondary/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-warning/20 blur-[140px]" />
      </div>

      <Container>
        <motion.div style={{ y, opacity }} className="grid items-center gap-12 lg:grid-cols-12">
          {/* left */}
          <div className="lg:col-span-7">
            <Reveal delay={0}>
              <SectionEyebrow>Gemini · Autonomous Agent · Live Simulation</SectionEyebrow>
            </Reveal>
            <h1 className="mt-8 font-display text-[64px] font-semibold leading-[0.95] tracking-tight text-foreground sm:text-[88px] md:text-[120px] lg:text-[140px]">
              {"Watch AI".split("").map((c, i) => (
                <motion.span
                  key={`a-${i}`}
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.04, ease: EASE }}
                  className="inline-block"
                >
                  {c === " " ? "\u00A0" : c}
                </motion.span>
              ))}
              <br />
              {"Cook Like".split("").map((c, i) => (
                <motion.span
                  key={`b-${i}`}
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.04, ease: EASE }}
                  className="inline-block"
                >
                  {c === " " ? "\u00A0" : c}
                </motion.span>
              ))}
              <br />
              <motion.span
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
                className="inline-block italic gradient-text"
              >
                a Human.
              </motion.span>
            </h1>

            <Reveal delay={6}>
              <p className="mt-8 max-w-xl text-lg text-foreground/65 md:text-2xl">
                An autonomous Gemini-powered cooking agent that reasons, plans,
                uses tools, manages inventory, and prepares dishes step-by-step.
              </p>
            </Reveal>

            <Reveal delay={7}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <MagneticButton href="#kitchen" variant="primary">Explore Agent</MagneticButton>
                <MagneticButton href="#simulation" variant="ghost">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background text-[10px]">▶</span>
                  Watch Simulation
                </MagneticButton>
              </div>
            </Reveal>

            <Reveal delay={9}>
              <div className="mt-14 grid max-w-md grid-cols-3 gap-6 text-sm">
                {[
                  ["6", "Reasoning steps"],
                  ["8", "Cooking tools"],
                  ["9", "Live ingredients"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-3xl font-semibold">{n}</div>
                    <div className="text-foreground/55">{l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* right — floating plate */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto aspect-square w-full max-w-[560px]">
              {/* plate */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-6 rounded-full bg-gradient-to-br from-white to-[#fff3ee] shadow-[0_40px_100px_-20px_rgba(255,90,54,0.45)]"
              >
                <div className="absolute inset-6 rounded-full border border-foreground/5" />
                <div className="absolute inset-14 rounded-full bg-gradient-to-br from-[#ffe7dd] to-[#ffd1bf]" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-20 rounded-full border-2 border-dashed border-primary/30"
                />
                <div className="absolute inset-0 grid place-items-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[140px] drop-shadow-xl"
                  >
                    🍔
                  </motion.div>
                </div>
              </motion.div>

              {FLOATING_INGREDIENTS.map((i) => (
                <motion.div
                  key={i.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: [0, -18, 0],
                  }}
                  transition={{
                    opacity: { delay: 0.6 + i.delay, duration: 0.6 },
                    scale: { delay: 0.6 + i.delay, duration: 0.6 },
                    y: { duration: 4 + i.delay, repeat: Infinity, ease: "easeInOut", delay: i.delay },
                  }}
                  style={{ left: i.x, top: i.y }}
                  className="absolute"
                >
                  <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-sm shadow-lg">
                    <span className="text-2xl">{i.emoji}</span>
                    <span className="font-medium text-foreground/80">{i.label}</span>
                  </div>
                </motion.div>
              ))}

              {/* status pill */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2"
              >
                <div className="glass-dark flex items-center gap-3 rounded-full px-5 py-2.5 text-sm text-background">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Agent online · gemini-1.5-pro
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

function MagneticButton({
  children,
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  href: string;
  variant?: "primary" | "ghost";
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: (e.clientX - (r.left + r.width / 2)) * 0.25, y: (e.clientY - (r.top + r.height / 2)) * 0.25 });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={
        variant === "primary"
          ? "group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground shadow-[0_15px_40px_-10px_rgba(255,90,54,0.5)] transition hover:shadow-[0_25px_60px_-10px_rgba(255,90,54,0.7)]"
          : "inline-flex items-center gap-3 rounded-full border border-foreground/15 bg-white/70 px-6 py-4 text-base font-medium text-foreground backdrop-blur transition hover:bg-white"
      }
    >
      {children}
      {variant === "primary" && <span aria-hidden className="transition group-hover:translate-x-1">→</span>}
    </motion.a>
  );
}

/* ---------- About ---------- */

const OBJECTIVES = [
  { title: "AI Reasoning", desc: "Gemini thinks through every order, weighing context, constraints and ingredients before acting.", icon: "🧠" },
  { title: "Tool Calling", desc: "The agent invokes real cooking functions like grill, toast, fry and combine — not just text.", icon: "🛠️" },
  { title: "State Management", desc: "Inventory, in-flight dishes and previous steps are tracked across the entire execution.", icon: "📦" },
  { title: "Multi-Step Execution", desc: "Each dish is decomposed into a structured plan and executed in deterministic order.", icon: "⚡" },
  { title: "Structured Outputs", desc: "Every action returns clean JSON, ready to be verified, logged or chained.", icon: "{ }" },
  { title: "Autonomous Decisions", desc: "When a step fails or ingredients are missing, the agent re-plans without human help.", icon: "🤖" },
];

function About() {
  return (
    <section id="about" className="relative py-32">
      <Container>
        <div className="grid items-end gap-10 md:grid-cols-2">
          <Reveal>
            <SectionEyebrow>The Project</SectionEyebrow>
            <h2 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
              Modern AI does <br />
              <span className="italic gradient-text">more than chat.</span>
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="text-lg text-foreground/65 md:text-xl">
              ChefGenius demonstrates a complete agentic loop — reasoning, planning, tool-calling and verification — wrapped in a tactile kitchen metaphor. Six objectives, one autonomous chef.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map((o, i) => (
            <Reveal key={o.title} delay={i}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="glass group relative h-full overflow-hidden rounded-3xl p-8"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition group-hover:bg-primary/30" />
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background text-xl">{o.icon}</div>
                <h3 className="mt-6 font-display text-2xl font-semibold">{o.title}</h3>
                <p className="mt-3 text-foreground/65">{o.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- How agent thinks (timeline) ---------- */

const STEPS = [
  { n: "01", title: "Understand Order", desc: "Parse the customer request into intent + dish target." },
  { n: "02", title: "Analyze Inventory", desc: "Cross-check available ingredients and stock thresholds." },
  { n: "03", title: "Choose Tools", desc: "Select kitchen tools — grill, toast, combine, serve." },
  { n: "04", title: "Generate Plan", desc: "Emit a structured, ordered cooking plan as JSON." },
  { n: "05", title: "Execute Actions", desc: "Call each tool, update state, react to results." },
  { n: "06", title: "Verify Dish", desc: "Semantically match the prepared dish to the order." },
];

function HowItThinks() {
  return (
    <section className="relative py-32">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>How the agent thinks</SectionEyebrow>
            <h2 className="mt-6 font-display text-5xl font-semibold leading-tight md:text-7xl">
              A six-step <span className="italic gradient-text">cognitive loop.</span>
            </h2>
          </div>
        </Reveal>

        <div className="relative mt-20">
          {/* connector line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-foreground/15 to-transparent md:block" />
          <div className="space-y-12">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i}>
                <div className={`flex items-center gap-6 md:gap-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className="flex-1">
                    <div className={`glass rounded-3xl p-8 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                      <div className="font-display text-sm tracking-widest text-primary">{s.n}</div>
                      <h3 className="mt-2 font-display text-3xl font-semibold">{s.title}</h3>
                      <p className="mt-2 text-foreground/65">{s.desc}</p>
                    </div>
                  </div>
                  <motion.div
                    whileInView={{ scale: [0.6, 1.1, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-xl"
                  >
                    <span aria-hidden>{i % 2 === 0 ? "→" : "←"}</span>
                  </motion.div>
                  <div className="hidden flex-1 md:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Kitchen dashboard ---------- */

const INVENTORY = [
  { name: "Bread", qty: 12, max: 20, emoji: "🍞" },
  { name: "Potato", qty: 18, max: 20, emoji: "🥔" },
  { name: "Cheese", qty: 9, max: 15, emoji: "🧀" },
  { name: "Lettuce", qty: 7, max: 10, emoji: "🥬" },
  { name: "Tomato", qty: 11, max: 15, emoji: "🍅" },
  { name: "Onion", qty: 14, max: 15, emoji: "🧅" },
  { name: "Butter", qty: 4, max: 10, emoji: "🧈" },
  { name: "Salt", qty: 19, max: 20, emoji: "🧂" },
  { name: "Oil", qty: 8, max: 12, emoji: "🫒" },
];

const TOOLS = [
  { name: "chop()", desc: "Slice ingredients", icon: "🔪" },
  { name: "grill()", desc: "Sear on grill", icon: "🔥" },
  { name: "fry()", desc: "Pan fry", icon: "🍳" },
  { name: "toast()", desc: "Brown surface", icon: "🍞" },
  { name: "bake()", desc: "Oven cook", icon: "🥧" },
  { name: "boil()", desc: "In water", icon: "💧" },
  { name: "combine()", desc: "Assemble parts", icon: "🥗" },
  { name: "serve()", desc: "Plate dish", icon: "🍽️" },
];

function Kitchen() {
  return (
    <section id="kitchen" className="relative py-32">
      <Container>
        <Reveal>
          <SectionEyebrow>Virtual Kitchen</SectionEyebrow>
          <h2 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-tight md:text-7xl">
            A live dashboard the <span className="italic gradient-text">agent controls.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-5">
          {/* Inventory */}
          <Reveal className="lg:col-span-3">
            <div className="glass h-full rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-foreground/50">Inventory Panel</div>
                  <h3 className="mt-1 font-display text-3xl font-semibold">Stock & availability</h3>
                </div>
                <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">9 items tracked</span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {INVENTORY.map((it, i) => {
                  const pct = (it.qty / it.max) * 100;
                  const level = pct > 60 ? "ok" : pct > 30 ? "low" : "crit";
                  const color = level === "ok" ? "bg-success" : level === "low" ? "bg-warning" : "bg-primary";
                  return (
                    <motion.div
                      key={it.name}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-2xl bg-white/70 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{it.emoji}</span>
                          <div>
                            <div className="font-medium">{it.name}</div>
                            <div className="text-xs text-foreground/55">{it.qty} / {it.max} units</div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${level === "ok" ? "text-success" : level === "low" ? "text-warning" : "text-primary"}`}>
                          {level === "ok" ? "In stock" : level === "low" ? "Low" : "Restock"}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.04, ease: EASE }}
                          className={`h-full rounded-full ${color}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Tools */}
          <Reveal delay={1} className="lg:col-span-2">
            <div className="glass h-full rounded-3xl p-8">
              <div className="text-xs uppercase tracking-widest text-foreground/50">Kitchen Tools</div>
              <h3 className="mt-1 font-display text-3xl font-semibold">Callable functions</h3>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {TOOLS.map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4, boxShadow: "0 20px 40px -10px rgba(255,90,54,0.35)" }}
                    className="group cursor-pointer rounded-2xl border border-foreground/10 bg-white/80 p-4 transition hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-[10px] text-foreground/40 transition group-hover:text-primary">CALL</span>
                    </div>
                    <div className="mt-3 font-mono text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-foreground/55">{t.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Live simulation ---------- */

const SIM_STEPS = [
  { tool: "grill", arg: "potato", result: "grilled patty", emoji: "🔥" },
  { tool: "toast", arg: "bread", result: "toasted bun", emoji: "🍞" },
  { tool: "combine", arg: "bun + patty + cheese + lettuce + tomato", result: "burger", emoji: "🥗" },
  { tool: "serve", arg: "burger", result: "SUCCESS", emoji: "🍽️" },
];

function Simulation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!inView || running) return;
    setRunning(true);
    let i = 0;
    setActive(0);
    const t = setInterval(() => {
      i++;
      if (i >= SIM_STEPS.length) {
        clearInterval(t);
        return;
      }
      setActive(i);
    }, 1800);
    return () => clearInterval(t);
  }, [inView, running]);

  const restart = () => {
    setActive(-1);
    setRunning(false);
    setTimeout(() => setRunning(false), 50);
  };

  return (
    <section id="simulation" ref={ref} className="relative py-32">
      <Container>
        <Reveal>
          <SectionEyebrow>Live Agent Simulation</SectionEyebrow>
          <div className="mt-6 grid items-end gap-6 md:grid-cols-2">
            <h2 className="font-display text-5xl font-semibold leading-tight md:text-7xl">
              One order. <br />
              <span className="italic gradient-text">A real agent loop.</span>
            </h2>
            <p className="text-lg text-foreground/65 md:text-xl">
              The customer asks for a burger. Watch the agent reason, call tools, update state, and verify the dish — all in real time.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          {/* terminal */}
          <Reveal className="lg:col-span-7">
            <div className="glass-dark overflow-hidden rounded-3xl text-background">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="font-mono text-xs text-background/60">agent.run(order="burger")</div>
                <button onClick={restart} className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
                  ⟲ Restart
                </button>
              </div>
              <div className="space-y-3 p-6 font-mono text-sm">
                <div className="text-background/60">› parsing order…</div>
                <div className="text-background/60">› analyzing inventory…</div>
                <div className="text-background/60">› planning steps…</div>
                <div className="mt-4 space-y-2">
                  {SIM_STEPS.map((s, i) => {
                    const done = active > i;
                    const current = active === i;
                    return (
                      <motion.div
                        key={s.tool}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: active >= i ? 1 : 0.3, x: 0 }}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          done ? "border-success/30 bg-success/10" : current ? "border-primary/40 bg-primary/10" : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <span className="text-lg">{s.emoji}</span>
                        <div className="flex-1">
                          <div className="text-background">
                            <span className="text-primary">{s.tool}</span>
                            <span className="text-background/60">(</span>
                            <span className="text-warning">{s.arg}</span>
                            <span className="text-background/60">)</span>
                          </div>
                          <div className="mt-1 text-xs text-background/60">
                            → {done ? s.result : current ? <span className="inline-flex items-center gap-1">executing<DotDot /></span> : "pending"}
                          </div>
                        </div>
                        <span className={`text-xs ${done ? "text-success" : current ? "text-warning" : "text-background/40"}`}>
                          {done ? "✓ done" : current ? "● run" : "○ wait"}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {active >= SIM_STEPS.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-xl border border-success/30 bg-success/15 p-4 text-success"
                    >
                      ✓ Order complete · verification: SUCCESS
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>

          {/* live plate */}
          <Reveal delay={1} className="lg:col-span-5">
            <div className="glass relative flex h-full flex-col items-center justify-center rounded-3xl p-10">
              <div className="text-xs uppercase tracking-widest text-foreground/50">Currently preparing</div>
              <div className="mt-2 font-display text-2xl font-semibold">Customer Burger</div>

              <div className="relative mt-8 grid h-64 w-64 place-items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                />
                <motion.div
                  key={active}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-[120px]"
                >
                  {active < 0 ? "🍽️" : active === 0 ? "🥔" : active === 1 ? "🍞" : "🍔"}
                </motion.div>
              </div>

              <div className="mt-8 w-full">
                <div className="flex justify-between text-xs text-foreground/55">
                  <span>Progress</span>
                  <span>{Math.max(0, Math.min(SIM_STEPS.length, active + 1))} / {SIM_STEPS.length}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
                  <motion.div
                    animate={{ width: `${((active + 1) / SIM_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function DotDot() {
  return (
    <span className="inline-flex">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

/* ---------- Neural reasoning viz ---------- */

const NODES = [
  { id: "order", label: "Order", x: 10, y: 50 },
  { id: "reason", label: "Reasoning", x: 30, y: 20 },
  { id: "tools", label: "Tool Selection", x: 30, y: 80 },
  { id: "inv", label: "Inventory", x: 55, y: 50 },
  { id: "exec", label: "Execution", x: 78, y: 25 },
  { id: "verify", label: "Verification", x: 78, y: 75 },
];
const EDGES: [string, string][] = [
  ["order", "reason"], ["order", "tools"], ["reason", "inv"], ["tools", "inv"],
  ["inv", "exec"], ["inv", "verify"], ["exec", "verify"],
];

function Neural() {
  const map = Object.fromEntries(NODES.map((n) => [n.id, n]));
  return (
    <section className="relative py-32">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>Reasoning Graph</SectionEyebrow>
            <h2 className="mt-6 font-display text-5xl font-semibold leading-tight md:text-7xl">
              Data flows like <span className="italic gradient-text">thought.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="glass-dark relative mt-16 overflow-hidden rounded-3xl p-6 text-background sm:p-12">
            <div className="relative h-[420px] w-full">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                {EDGES.map(([a, b], i) => {
                  const A = map[a], B = map[b];
                  return (
                    <g key={i}>
                      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(255,255,255,0.15)" strokeWidth={0.2} />
                      <motion.circle
                        r={0.6}
                        fill="#FF5A36"
                        animate={{
                          cx: [A.x, B.x],
                          cy: [A.y, B.y],
                        }}
                        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                      />
                    </g>
                  );
                })}
              </svg>
              {NODES.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
                      className="absolute inset-0 rounded-full bg-primary"
                    />
                    <div className="relative rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur">
                      {n.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- Structured outputs ---------- */

const JSON_CARDS = [
  { code: { action: "grill", ingredient: "potato", result: "grilled patty" } },
  { code: { action: "toast", ingredient: "bread", result: "toasted bun" } },
  { code: { verification: "SUCCESS" } },
];

function StructuredOutputs() {
  return (
    <section className="relative py-32">
      <Container>
        <Reveal>
          <SectionEyebrow>Structured Outputs</SectionEyebrow>
          <h2 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-tight md:text-7xl">
            Every action returns <span className="italic gradient-text">clean JSON.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {JSON_CARDS.map((c, i) => (
            <Reveal key={i} delay={i}>
              <motion.div whileHover={{ y: -6 }} className="glass-dark overflow-hidden rounded-3xl text-background">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-xs text-background/60">
                  <span className="font-mono">tool.output.json</span>
                  <span className="rounded-full bg-success/20 px-2 py-0.5 text-success">200 OK</span>
                </div>
                <pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed">
{`{\n${Object.entries(c.code)
  .map(([k, v]) => `  "${k}": "${v}"`)
  .join(",\n")}\n}`}
                </pre>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Verification ---------- */

function Verification() {
  return (
    <section className="relative py-32">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionEyebrow>Dish Verification Engine</SectionEyebrow>
            <h2 className="mt-6 font-display text-5xl font-semibold leading-tight md:text-7xl">
              Semantic <span className="italic gradient-text">match,</span> not string match.
            </h2>
            <p className="mt-6 max-w-lg text-lg text-foreground/65">
              "Burger" and "Cheeseburger" aren't the same string — but they describe the same dish. The agent uses Gemini to compare meaning, ingredients and intent before declaring success.
            </p>
          </Reveal>

          <Reveal delay={1}>
            <div className="glass relative rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/70 p-5">
                  <div className="text-xs uppercase tracking-widest text-foreground/50">Customer order</div>
                  <div className="mt-3 text-5xl">🍔</div>
                  <div className="mt-3 font-display text-2xl font-semibold">Burger</div>
                </div>
                <div className="rounded-2xl bg-white/70 p-5">
                  <div className="text-xs uppercase tracking-widest text-foreground/50">Prepared dish</div>
                  <div className="mt-3 text-5xl">🧀🍔</div>
                  <div className="mt-3 font-display text-2xl font-semibold">Cheeseburger</div>
                </div>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-foreground/50">
                <div className="h-px flex-1 bg-foreground/10" /> semantic compare <div className="h-px flex-1 bg-foreground/10" />
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="flex items-center justify-between rounded-2xl bg-foreground p-5 text-background"
              >
                <div>
                  <div className="text-xs uppercase tracking-widest text-background/50">Result</div>
                  <div className="mt-1 font-display text-3xl font-semibold text-success">SUCCESS</div>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="grid h-14 w-14 place-items-center rounded-full bg-success text-2xl"
                >
                  ✓
                </motion.div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features grid ---------- */

const FEATURES = [
  { t: "AI Reasoning", d: "Gemini decomposes complex orders into plans.", i: "🧠" },
  { t: "Dynamic Inventory", d: "Live stock tracking with thresholds.", i: "📦" },
  { t: "Tool Calling", d: "Eight real cooking functions.", i: "🛠️" },
  { t: "Workflow Planning", d: "Ordered multi-step execution.", i: "🗺️" },
  { t: "Structured Outputs", d: "Clean JSON on every action.", i: "{ }" },
  { t: "Dish Verification", d: "Semantic match instead of strings.", i: "✓" },
];

function Features() {
  return (
    <section className="relative py-32">
      <Container>
        <Reveal>
          <SectionEyebrow>Features</SectionEyebrow>
          <h2 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-tight md:text-7xl">
            Built for <span className="italic gradient-text">agentic cooking.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.t} delay={i}>
              <motion.div
                whileHover={{ y: -6 }}
                className="group relative h-full overflow-hidden rounded-3xl border border-foreground/10 bg-white p-8 transition hover:border-primary/50 hover:shadow-[0_30px_60px_-20px_rgba(255,90,54,0.4)]"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl text-white">{f.i}</div>
                <h3 className="mt-6 font-display text-2xl font-semibold">{f.t}</h3>
                <p className="mt-2 text-foreground/65">{f.d}</p>
                <span className="absolute right-6 top-6 text-xs text-foreground/30 transition group-hover:text-primary">0{i + 1}</span>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Tech stack ---------- */

const STACK = [
  { n: "Python", d: "Core runtime" },
  { n: "Gemini API", d: "Reasoning engine" },
  { n: "JSON", d: "Structured outputs" },
  { n: "React", d: "Frontend" },
  { n: "Tailwind CSS", d: "Styling" },
  { n: "Framer Motion", d: "Animation" },
];

function Tech() {
  return (
    <section id="tech" className="relative py-32">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>Technology</SectionEyebrow>
            <h2 className="mt-6 font-display text-5xl font-semibold leading-tight md:text-7xl">
              Built with the <span className="italic gradient-text">essentials.</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((s, i) => (
            <Reveal key={s.n} delay={i}>
              <motion.div
                whileHover={{ y: -4, rotate: -0.5 }}
                className="glass flex items-center justify-between rounded-2xl p-6"
              >
                <div>
                  <div className="font-display text-2xl font-semibold">{s.n}</div>
                  <div className="text-sm text-foreground/55">{s.d}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background">⚡</div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Gallery ---------- */

const DISHES = [
  { name: "Classic Burger", emoji: "🍔", tag: "8 steps · 5 ingredients" },
  { name: "Margherita Pizza", emoji: "🍕", tag: "12 steps · 6 ingredients" },
  { name: "Creamy Pasta", emoji: "🍝", tag: "9 steps · 7 ingredients" },
  { name: "Club Sandwich", emoji: "🥪", tag: "6 steps · 5 ingredients" },
];

function Gallery() {
  return (
    <section className="relative py-32">
      <Container>
        <Reveal>
          <SectionEyebrow>Project Gallery</SectionEyebrow>
          <h2 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-tight md:text-7xl">
            Dishes the agent <span className="italic gradient-text">has cooked.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DISHES.map((d, i) => (
            <Reveal key={d.name} delay={i}>
              <motion.div whileHover={{ y: -8 }} className="group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(17,17,17,0.15)]">
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#fff3ee] to-[#ffe0d2]">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 4 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 grid place-items-center text-[180px]"
                  >
                    {d.emoji}
                  </motion.div>
                  <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-medium backdrop-blur">
                    0{i + 1} · Verified
                  </div>
                </div>
                <div className="p-6">
                  <div className="font-display text-2xl font-semibold">{d.name}</div>
                  <div className="mt-1 text-sm text-foreground/55">{d.tag}</div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Final CTA ---------- */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[140px]" />
      </div>
      <Container>
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.06 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4 }}
            className="pointer-events-none absolute inset-x-0 -top-10 text-center font-display text-[160px] font-black leading-none tracking-tight text-foreground sm:text-[240px] md:text-[320px]"
          >
            FUTURE
          </motion.div>

          <div className="relative pt-20 text-center">
            <Reveal>
              <SectionEyebrow>Final word</SectionEyebrow>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="mx-auto mt-8 max-w-5xl font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-8xl">
                Building the <span className="italic gradient-text">future</span> <br />
                of autonomous <br /> AI agents.
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <div className="mt-12 flex justify-center">
                <MagneticButton href="#simulation" variant="primary">Launch Agent Simulation</MagneticButton>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="border-t border-foreground/10 pb-12 pt-20">
      <Container>
        <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-end">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background">
                <span className="font-display text-lg">C</span>
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
              </div>
              <span className="font-display text-2xl font-semibold">ChefGenius AI</span>
            </div>
            <p className="mt-4 text-foreground/65">
              A college project demonstrating an autonomous Gemini-powered cooking agent. Frontend simulation only.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-4 sm:grid-cols-3 md:grid-cols-5">
            {["Overview", "Features", "Simulation", "Technology", "Contact"].map((l) => (
              <a key={l} href="#" className="text-sm text-foreground/65 hover:text-foreground">
                {l}
              </a>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-foreground/10 pt-6 text-xs text-foreground/50 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} ChefGenius AI · Built with Gemini & Python</span>
          <span>Designed for the modern agentic web.</span>
        </div>
      </Container>
    </footer>
  );
}

/* ---------- Composition ---------- */

export function ChefGeniusLanding() {
  return (
    <div className="grain relative min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <About />
        <HowItThinks />
        <Kitchen />
        <Simulation />
        <AgentRunner />

        <Neural />
        <StructuredOutputs />
        <Verification />
        <Features />
        <Tech />
        <Gallery />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}