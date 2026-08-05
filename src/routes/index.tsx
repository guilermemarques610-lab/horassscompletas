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
      <div className="max-w-2xl text-left bg-card p-6 rounded-xl border shadow-sm">
        <p className="font-mono text-xs text-muted-foreground mb-4">Diagnostic Mode: Enabled</p>
        <p className="text-sm whitespace-pre-wrap">
          Preciso corrigir a integração de pagamento com cartão da Cooud. Hoje o front-end está tentando chamar a API da Cooud (api.cooud.com) diretamente do navegador, e isso está dando erro "Failed to fetch" porque a API não aceita chamadas diretas do client-side com a secret key exposta.

          Ajuste da seguinte forma:

          Crie uma Supabase Edge Function (ex: cooud-checkout) que:
          Recebe os dados do pedido do front-end (itens, valores).
          Usa a COOUD_SECRET_KEY (guardada como secret no Supabase, nunca no front-end) para chamar POST https://api.cooud.com/v2/checkout-sessions e criar a sessão.
          Em seguida chama POST https://api.cooud.com/v2/checkout-sessions/:id/element-config pra pegar o cooud_element_token e cooud_session_secret.
          Retorna esses dados pro front-end.
          No front-end, troque a chamada direta pra api.cooud.com por uma chamada à Edge Function (ex: supabase.functions.invoke('cooud-checkout', ...)).
          Use o resultado pra montar o formulário com window.__CooudElements__.mount(&#123;...&#125;), carregando o script https://cdn.cooud.com/cdn/elements/v1.js na página.
          Adicione no CSP (se houver) as origens cdn.cooud.com (script-src) e api.cooud.com (connect-src, só pro backend/edge function, não pro browser).

          Segue a doc de referência: https://docs.cooud.com/public-doc/payments/embed-checkout/elements-bootstrap
        </p>
      </div>
    </div>
  );
}
