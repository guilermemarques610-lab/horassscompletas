import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TikTok Rewards | Inicio" },
      {
        name: "description",
        content: "Inicio del fluxo de recompensas y retiro de saldo TikTok Rewards.",
      },
      { property: "og:title", content: "TikTok Rewards | Inicio" },
      {
        property: "og:description",
        content: "Inicio del fluxo de recompensas y retiro de saldo TikTok Rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/pressel/index.html");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-2xl font-bold">TikTok Rewards</h1>
      <p className="mb-2 whitespace-pre-wrap text-blue-500 text-xs">
        ta travado nessa parte..............
      </p>

    </div>
  );
}