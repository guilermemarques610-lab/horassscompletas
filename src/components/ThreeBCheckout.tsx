import { useEffect, useRef, useState } from "react";
import {
  THREEB_API_KEY,
  THREEB_BASE_URL,
  formatPrice,
  loadStripeJs,
  type CheckoutConfig,
} from "@/lib/checkout-config";
import { useThreeBTracking } from "@/lib/purchase-tracking";

export interface ThreeBCheckoutProps {
  /** ID do produto na 3B Pagamentos. */
  productId: string;
  /** Classes extras do container. */
  className?: string;
  /** Exibe o resumo do produto (imagem, nome e preço). Padrão: true. */
  showSummary?: boolean;
  /** Rota de destino após o pagamento aprovado. Padrão: "/obrigado". */
  returnPath?: string;
}

type StripePaymentError = {
  message?: string;
  code?: string;
};

type StripeSubmitResult = {
  error?: StripePaymentError;
};

type StripeConfirmResult = {
  error?: StripePaymentError;
};

type StripePaymentElement = {
  mount: (selectorOrElement: string | HTMLElement) => void;
  on: (event: "ready", callback: () => void) => void;
};

type StripeElements = {
  create: (
    type: "payment",
    options?: {
      terms?: { card?: "always" | "auto" | "never" };
      fields?: { billingDetails?: { email?: "auto" | "never" } };
      wallets?: { applePay?: "auto" | "never"; googlePay?: "auto" | "never"; link?: "auto" | "never" };
      paymentMethodOrder?: string[];
    },
  ) => StripePaymentElement;
  submit: () => Promise<StripeSubmitResult>;
};

type StripeInstance = {
  elements: (options: {
    clientSecret: string;
    locale?: string;
    appearance?: {
      theme?: "stripe" | "night" | "flat";
      variables?: Record<string, string>;
    };
  }) => StripeElements;
  confirmPayment: (options: {
    elements: StripeElements;
    clientSecret: string;
    confirmParams: {
      return_url: string;
      payment_method_data?: { billing_details?: { email?: string } };
    };
  }) => Promise<StripeConfirmResult>;
};

type StripeFactory = (publishableKey: string) => StripeInstance;

type PaymentIntentResponse = {
  clientSecret: string;
  paymentIntentId: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Checkout de cartão da 3B Pagamentos (Stripe Elements) embutido.
 * Carrega a config do produto, monta o Payment Element e confirma o pagamento.
 */
export function ThreeBCheckout({ productId, className, showSummary = true }: ThreeBCheckoutProps) {
  // Script oficial de tracking da 3B (checkout via API).
  useThreeBTracking(productId);
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [email, setEmail] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [intentReady, setIntentReady] = useState(false);

  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const clientSecretRef = useRef("");
  const paymentIntentIdRef = useRef("");
  const paymentBoxRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef("");
  emailRef.current = email;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!productId) {
          setLoadError("Falta el productId del producto 3B.");
          return;
        }

        const res = await fetch(
          `${THREEB_BASE_URL}/get-checkout-config?apiKey=${encodeURIComponent(
            THREEB_API_KEY,
          )}&productId=${encodeURIComponent(productId)}`,
        );
        if (!res.ok) throw new Error(await res.text());
        const data: CheckoutConfig = await res.json();
        if (cancelled) return;
        setConfig(data);
      } catch (e: unknown) {
        if (!cancelled) setLoadError(getErrorMessage(e, "No se pudo cargar el checkout."));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function preparePaymentIntent() {
    if (!config || intentReady || creatingIntent) return;

    setPayError(null);
    setCreatingIntent(true);
    setReady(false);
    try {
      const buyerEmail = emailRef.current.trim();
      if (!buyerEmail) {
        setPayError("Introduce tu email para recibir el acceso.");
        return;
      }

      const Stripe = (await loadStripeJs()) as StripeFactory;
      const stripe = Stripe(config.publishableKey);
      stripeRef.current = stripe;

      const res = await fetch(`${THREEB_BASE_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: THREEB_API_KEY,
          productId: config.product.id,
          quantity: 1,
          buyerEmail,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const intent: PaymentIntentResponse = await res.json();
      clientSecretRef.current = intent.clientSecret;
      paymentIntentIdRef.current = intent.paymentIntentId;

      const elements = stripe.elements({
        clientSecret: intent.clientSecret,
        locale: "es",
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#f43f5e",
            borderRadius: "12px",
            fontFamily: "system-ui, sans-serif",
          },
        },
      });
      elementsRef.current = elements;

      if (paymentBoxRef.current) {
        paymentBoxRef.current.replaceChildren();
        const payment = elements.create("payment", {
          terms: { card: "never" },
          fields: { billingDetails: { email: "never" } },
          wallets: { applePay: "never", googlePay: "never", link: "never" },
          paymentMethodOrder: ["card"],
        });
        payment.mount(paymentBoxRef.current);
        payment.on("ready", () => setReady(true));
      }
      setIntentReady(true);
    } catch (e: unknown) {
      setPayError(getErrorMessage(e, "No se pudo preparar el pago."));
    } finally {
      setCreatingIntent(false);
    }
  }

  async function pay() {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    const clientSecret = clientSecretRef.current;
    if (!stripe || !elements || !config || !clientSecret) return;

    setPayError(null);
    setPaying(true);
    try {
      const buyerEmail = emailRef.current.trim();
      if (!buyerEmail) {
        setPayError("Introduce tu email para recibir el acceso.");
        setPaying(false);
        return;
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPayError(submitError.message || "Revisa los datos de pago.");
        setPaying(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/obrigado?payment_intent=${paymentIntentIdRef.current}&productId=${encodeURIComponent(productId)}`,
          payment_method_data: { billing_details: { email: buyerEmail } },
        },
      });
      if (error) setPayError(error.message || "No se pudo procesar el pago.");
    } catch (e: unknown) {
      setPayError(getErrorMessage(e, "No se pudo procesar el pago."));
    } finally {
      setPaying(false);
    }
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-600 shadow">
        {loadError}
      </div>
    );
  }

  return (
    <section className={`rounded-3xl bg-white p-5 text-left shadow-xl sm:p-6 ${className ?? ""}`}>
      {showSummary && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
          {config?.product.imageUrl ? (
            <img
              src={config.product.imageUrl}
              alt={config.product.name}
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="h-14 w-14 animate-pulse rounded-xl bg-neutral-200" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-neutral-800">
              {config?.product.name ?? "Cargando…"}
            </p>
            {config?.product.description && (
              <p className="truncate text-xs text-neutral-500">{config.product.description}</p>
            )}
          </div>
          <span className="shrink-0 text-base font-black text-rose-500">
            {config ? formatPrice(config.product.priceCents, config.product.currency) : "—"}
          </span>
        </div>
      )}

      <label className="mb-1 block text-sm font-semibold text-neutral-700" htmlFor="3b-email">
        Tu email
      </label>
      <input
        id="3b-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
        disabled={intentReady || creatingIntent || paying}
      />

      {!intentReady && (
        <button
          type="button"
          onClick={() => void preparePaymentIntent()}
          disabled={!config || creatingIntent}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99] disabled:opacity-50"
        >
          {creatingIntent ? "Preparando pago…" : "Continuar al pago"}
        </button>
      )}

      <div ref={paymentBoxRef} className={`mb-4 min-h-[120px] ${intentReady ? "" : "hidden"}`} />

      {payError && (
        <p className="mb-3 text-sm font-medium text-rose-600" role="alert">
          {payError}
        </p>
      )}

      {intentReady && (
        <button
          type="button"
          onClick={() => void pay()}
          disabled={!ready || paying}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99] disabled:opacity-50"
        >
          {paying
            ? "Procesando…"
            : `Pagar ${config ? formatPrice(config.product.priceCents, config.product.currency) : ""}`}
        </button>
      )}

      <p className="mt-4 text-center text-[11px] leading-snug text-neutral-400">
        Pago seguro. Tus datos de tarjeta se procesan directamente por Stripe y nunca pasan por
        nuestros servidores.
      </p>
    </section>
  );
}
