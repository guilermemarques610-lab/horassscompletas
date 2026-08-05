import { useEffect } from "react";
import { THREEB_API_KEY, THREEB_BASE_URL, loadStripeJs } from "./checkout-config";
import { ttqTrack } from "./tiktok-pixel";

/**
 * Injeta o script oficial de tracking da 3B Pagamentos.
 * Deve estar presente nas páginas de CHECKOUT e de OBRIGADO (checkout via API).
 * Na página de obrigado ele lê o ?payment_intent=, confirma o pagamento com a 3B
 * e dispara a conversão também server-side (Events API).
 */
export function useThreeBTracking(productId: string) {
  useEffect(() => {
    if (!productId) return;
    const selector = `script[data-3b-tracking="${productId}"]`;
    if (document.querySelector(selector)) return;

    const s = document.createElement("script");
    s.src = "https://checkout.cooud.com/api/v1/tracking.js";
    s.async = true;
    s.dataset.apiKey = THREEB_API_KEY;
    s.dataset.productId = productId;
    s.dataset["3bTracking"] = productId;
    s.onerror = () => console.error("3B tracking script failed to load");
    document.body.appendChild(s);
  }, [productId]);
}

type PurchaseOptions = {
  /** ID do produto usado na compra (mesmo passado à API da 3B). */
  productId: string;
};

/**
 * Dispara o evento Purchase do TikTok APENAS após confirmação real do pagamento.
 * - Valida o status do PaymentIntent no Stripe (não confia só na URL).
 * - Usa o payment_intent como event_id (dedupe com o server-side da 3B).
 * - Deduplica no navegador via sessionStorage.
 */
export function useTikTokPurchase({ productId }: PurchaseOptions) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const paymentIntentId = params.get("payment_intent");
        const clientSecret = params.get("payment_intent_client_secret");
        const redirectStatus = params.get("redirect_status");
        if (!paymentIntentId) return;

        const dedupeKey = `ttq_purchase_${paymentIntentId}`;
        if (sessionStorage.getItem(dedupeKey)) return;

        // 1) Config do produto (valor real e moeda) + publishable key.
        const res = await fetch(
          `${THREEB_BASE_URL}/get-checkout-config?apiKey=${encodeURIComponent(
            THREEB_API_KEY,
          )}&productId=${encodeURIComponent(productId)}`,
        );
        if (!res.ok) throw new Error(await res.text());
        const config = await res.json();
        if (cancelled) return;

        // 2) Confirmação do pagamento.
        let paid = redirectStatus === "succeeded";
        if (clientSecret) {
          const Stripe = await loadStripeJs();
          if (cancelled) return;
          const stripe = Stripe(config.publishableKey);
          const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
          paid = paymentIntent?.status === "succeeded";
        }
        if (!paid || cancelled) return;

        // 3) Purchase com value / currency / event_id.
        const currency = String(config?.product?.currency ?? "eur").toUpperCase();
        const value = Number(config?.product?.priceCents ?? 0) / 100;

        sessionStorage.setItem(dedupeKey, "1");
        ttqTrack(
          "Purchase",
          {
            content_id: productId,
            content_type: "product",
            content_name: config?.product?.name ?? "Produto",
            quantity: 1,
            price: value,
            value,
            currency,
          },
          paymentIntentId,
        );
      } catch (err) {
        console.error("TikTok Purchase tracking failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);
}
