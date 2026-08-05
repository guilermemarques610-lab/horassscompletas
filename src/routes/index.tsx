import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TikTok Rewards | Inicio" },
      {
        name: "description",
        content: "Inicio del flujo de recompensas y retiro de saldo TikTok Rewards.",
      },
      { property: "og:title", content: "TikTok Rewards | Inicio" },
      {
        property: "og:description",
        content: "Inicio del flujo de recompensas y retiro de saldo TikTok Rewards.",
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
      <p className="mb-2 whitespace-pre-wrap">
        Access to fetch at 'https://checkout.cooud.com/api/v1/get-checkout-config?apiKey=cooud_sk_live_E4MpcDlkqeiXlMDMvTeXtpkLULIk_aQH6pQ_PTRO3AA&productId=01KZ7W13DD2MVBGG66NPG9EA9T' from origin 'https://preview--horascompletas.lovable.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
        checkout.cooud.com/api/v1/get-checkout-config?apiKey=cooud_sk_live_E4MpcDlkqeiXlMDMvTeXtpkLULIk_aQH6pQ_PTRO3AA&productId=01KZ7W13DD2MVBGG66NPG9EA9T:1  Failed to load resource: net::ERR_FAILED

        Essas as mensagens de erro
      </p>
    </div>
  );
}
