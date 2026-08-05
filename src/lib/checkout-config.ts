// Chave PÚBLICA da 3B Pagamentos (visível no front, apenas identifica a loja).
export const THREEB_API_KEY =
  "cooud_sk_live_E4MpcDlkqeiXlMDMvTeXtpkLULIk_aQH6pQ_PTRO3AA";

export const THREEB_BASE_URL = "https://checkout.cooud.com/api/v1";

// ID do produto padrão. Pode ser sobrescrito por ?productId=... na URL.
export const DEFAULT_PRODUCT_ID = "01KZ7W13DD2MVBGG66NPG9EA9T";

// Produto da oferta de back-redirect (3B Pagamentos).
export const BACK_REDIRECT_PRODUCT_ID = "43ca5d35-3492-4567-913d-dc2843ba6931";

// Produto do upsell /up1 (página "El pago no se ha completado").
export const UP1_PRODUCT_ID = "65009b71-7660-44ef-ba87-24f29c7599a4";

export type CheckoutConfig = {
  store: { name: string };
  product: {
    id: string;
    name: string;
    description?: string;
    priceCents: number;
    currency: string;
    imageUrl?: string;
    requiresShipping?: boolean;
  };
  publishableKey: string;
};

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: (currency || "eur").toUpperCase(),
  }).format(cents / 100);
}

let stripePromise: Promise<any> | null = null;

export function loadStripeJs(): Promise<any> {
  if (stripePromise) return stripePromise;
  stripePromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    const w = window as any;
    if (w.Stripe) return resolve(w.Stripe);
    const existing = document.querySelector<HTMLScriptElement>("script[data-stripe-js]");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).Stripe));
      existing.addEventListener("error", () => reject(new Error("stripe.js failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.cooud.com/cdn/elements/v1.js";
    s.async = true;
    s.dataset.stripeJs = "true";
    s.onload = () => resolve((window as any).Stripe || (window as any).__CooudElements__);
    s.onerror = () => reject(new Error("cooud elements js failed"));
    document.head.appendChild(s);
  });
  return stripePromise;
}
