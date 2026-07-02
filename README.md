# 🍳 Chef Genius AI

An autonomous AI-powered cooking agent that watches, reasons, and prepares dishes step-by-step — powered by Google Gemini.

![Chef Genius AI](https://img.shields.io/badge/Powered%20By-Gemini%20AI-blue?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TanStack](https://img.shields.io/badge/TanStack-Start-FF4154?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)

---

## ✨ What is Chef Genius AI?

Chef Genius AI is a full-stack web application where users can place a food order (e.g., "Burger", "Pizza", "Pasta") and watch a Gemini-powered autonomous agent reason through a recipe, call kitchen tools, track inventory, and serve the final dish — all in real time.

It's not just a chatbot. The agent:
- **Plans** a complete recipe from scratch
- **Calls tools** like `chop`, `grill`, `fry`, `toast`, `combine`, `serve`
- **Tracks inventory** and deducts/adds ingredients as it cooks
- **Verifies** the final dish matches the customer order

---

## 🚀 Live Demo

> Deployed on Vercel — [chef-genius-ai.vercel.app](https://chef-genius-ai.vercel.app)

---

## 🎬 Features

| Feature | Description |
|---|---|
| 🤖 **Autonomous Agent** | Gemini plans and executes the full recipe autonomously |
| 🍳 **Kitchen Tools** | `chop`, `grill`, `fry`, `toast`, `bake`, `boil`, `combine`, `serve` |
| 📦 **Inventory Tracking** | Real-time ingredient tracking with add/consume logic |
| ✅ **Dish Verification** | Semantic matching to confirm the correct dish was served |
| 🌙 **Dark Mode** | Full red-black food-themed dark mode |
| 🎨 **GSAP Animations** | Hero text animations, scroll reveals, floating food items |
| 📱 **Fully Responsive** | Works on mobile, tablet, and desktop |
| ⚡ **SSR** | Server-Side Rendering via TanStack Start + Nitro |

---

## 🛠️ Tech Stack

### Frontend
- **[React 19](https://react.dev/)** — UI library
- **[TanStack Start](https://tanstack.com/start)** — Full-stack React framework with SSR
- **[TanStack Router](https://tanstack.com/router)** — Type-safe file-based routing
- **[TanStack Query](https://tanstack.com/query)** — Server state management
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first CSS
- **[Framer Motion](https://www.framer.com/motion/)** — Animations and transitions
- **[GSAP](https://greensock.com/gsap/)** — Advanced scroll animations and SplitText effects
- **[Radix UI](https://www.radix-ui.com/)** — Accessible headless UI primitives
- **[Lucide React](https://lucide.dev/)** — Icons
- **[Sonner](https://sonner.emilkowal.ski/)** — Toast notifications

### Backend
- **[Google Gemini API](https://ai.google.dev/)** — `gemini-3.1-flash-lite` model for recipe planning
- **[TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/server-functions)** — Type-safe server-side functions
- **[Zod](https://zod.dev/)** — Runtime input validation
- **[Supabase](https://supabase.com/)** — Auth & database integration
- **[Nitro](https://nitro.unjs.io/)** — Server engine (Vercel preset)

### Dev Tools
- **[Vite 8](https://vite.dev/)** — Build tool and dev server
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** — Code quality

---

## 📁 Project Structure

```
chef-genius-ai/
├── src/
│   ├── components/
│   │   ├── chefgenius/
│   │   │   ├── Landing.tsx          # Hero section with GSAP animations
│   │   │   └── AgentRunner.tsx      # Live agent UI with order panel + trace viewer
│   │   └── ui/
│   │       ├── SplitText.tsx        # GSAP SplitText animation component
│   │       ├── gsap-effects.tsx     # Reusable GSAP animation effects
│   │       └── ...                  # 40+ Radix UI / shadcn components
│   ├── lib/
│   │   ├── cookingAgent.functions.ts  # Core agent logic + Gemini API calls
│   │   └── utils.ts                   # Shared utilities
│   ├── routes/
│   │   ├── __root.tsx               # Root layout with theme/dark mode
│   │   └── index.tsx                # Home page
│   ├── hooks/
│   │   ├── useTheme.ts              # Dark/light mode toggle
│   │   └── use-mobile.tsx           # Mobile breakpoint detection
│   ├── integrations/
│   │   └── supabase/                # Supabase client, auth, types
│   ├── styles.css                   # Global styles, design tokens, dark mode
│   └── router.tsx                   # TanStack Router configuration
├── .env                             # Environment variables (not committed)
├── vite.config.ts                   # Vite + TanStack Start config
├── package.json
└── README.md
```

---

## 🤖 How the Cooking Agent Works

The agent is entirely contained in `src/lib/cookingAgent.functions.ts`:

### 1. Single-turn Recipe Planning
The agent makes **one API call** to Gemini, passing the order and current inventory. Gemini responds with a JSON array of cooking steps (no multi-turn chat, no function calling complexity).

```ts
// Example: order = "Burger"
// Gemini returns:
[
  { "tool": "grill",   "args": { "ingredient": "potato" } },
  { "tool": "toast",   "args": { "ingredient": "bread" } },
  { "tool": "chop",    "args": { "ingredient": "lettuce" } },
  { "tool": "combine", "args": { "ingredients": ["grilled patty", "toasted bun", "chopped lettuce", "cheese"], "result_name": "burger" } },
  { "tool": "serve",   "args": { "dish": "burger" } }
]
```

### 2. Local Kitchen Execution
Steps are executed locally by the `Kitchen` class — no extra API calls. It tracks inventory with a `Set<string>`.

### 3. Available Kitchen Tools

| Tool | Input | Output |
|------|-------|--------|
| `list_inventory` | — | Current ingredient list |
| `chop` | ingredient | `"chopped <ingredient>"` |
| `grill` | ingredient | `"grilled <ingredient>"` (potato → `"grilled patty"`) |
| `fry` | ingredient | `"fried <ingredient>"` (requires oil) |
| `toast` | ingredient | `"toasted bun"` (bread) |
| `bake` | ingredient | Baked in place |
| `boil` | ingredient | `"boiled <ingredient>"` |
| `combine` | ingredients[], result_name | Creates final assembled dish |
| `serve` | dish | Marks dish as served |

### 4. Verification
After serving, dish identity is verified locally using semantic string matching — no extra API call needed.

### 5. Default Inventory
```
bread, potato, cheese, lettuce, tomato, onion,
butter, oil, salt, flour, egg, milk, chicken, pasta, tomato sauce
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** v18+ or **Bun**
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/AditiGarud20/chef-genius-ai.git
cd chef-genius-ai
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Get your free API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 4. Run the Development Server

```bash
npm run dev
```

Open **[http://localhost:8081](http://localhost:8081)** in your browser.

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server at http://localhost:8081 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run deploy` | Build and deploy to Vercel |
| `npm run deploy:prod` | Build and deploy to Vercel production |

---

## 🌙 Dark Mode

The app ships with a full dark mode using a **red-black food theme**:

- Background: Near-black with warm red tint
- Primary: Vivid red (`#E63E22`)
- Accent colors: Saffron, herb green, berry, grape, citrus
- Toggle via the sun/moon button in the navbar

---

## 🎨 Design System

Colors are defined as CSS custom properties using `oklch` color space in `src/styles.css`:

```css
/* Brand */
--primary: oklch(0.685 0.211 33);   /* #FF5A36 */
--secondary: oklch(0.77 0.155 38);  /* #FF8A65 */

/* Food accents */
--saffron: oklch(0.82 0.16 80);     /* warm golden */
--herb: oklch(0.72 0.17 145);       /* fresh green */
--berry: oklch(0.62 0.22 350);      /* raspberry */
--grape: oklch(0.55 0.20 300);      /* plum */
--citrus: oklch(0.86 0.17 95);      /* lemon */
```

Typography uses **Playfair Display** (display) and **Inter** (body).

---

## 🚢 Deployment

The project is configured for **Vercel** deployment via Nitro:

```bash
npm run deploy:prod
```

Or connect your GitHub repo to Vercel for automatic deployments on every push to `main`.

**Required environment variable on Vercel:**
```
GEMINI_API_KEY = your_key_here
```

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

## 👩‍💻 Author

**Aditi Garud**
- GitHub: [@AditiGarud20](https://github.com/AditiGarud20)
- Project: [Chef Genius AI](https://github.com/AditiGarud20/chef-genius-ai)

---

> Built with ❤️ using React, TanStack Start, Gemini AI, GSAP, and Tailwind CSS
