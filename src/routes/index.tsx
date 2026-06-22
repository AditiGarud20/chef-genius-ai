import { createFileRoute } from "@tanstack/react-router";
import { ChefGeniusLanding } from "@/components/chefgenius/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChefGenius AI — Watch AI Cook Like a Human" },
      { name: "description", content: "An autonomous Gemini-powered cooking agent that reasons, plans, uses tools, manages inventory, and prepares dishes step-by-step." },
      { property: "og:title", content: "ChefGenius AI — Watch AI Cook Like a Human" },
      { property: "og:description", content: "Premium frontend demonstration of a Gemini cooking agent." },
    ],
  }),
  component: Index,
});

function Index() {
  return <ChefGeniusLanding />;
}
