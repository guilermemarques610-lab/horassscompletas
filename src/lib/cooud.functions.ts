import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const COOUD_API_URL = "https://checkout.cooud.com/api/v1"; // User said api.cooud.com but current code uses checkout.cooud.com/api/v1

export const createCooudCheckout = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        productId: z.string(),
        buyerEmail: z.string().email(),
        quantity: z.number().default(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["COOUD_SECRET_KEY"];
    if (!apiKey) {
      throw new Error("COOUD_SECRET_KEY not configured on server");
    }

    // 1. Create Checkout Session (User asked for /v2/checkout-sessions, but current API uses /create-payment-intent or similar)
    // Looking at the user's instructions vs current code.
    // User says: POST https://api.cooud.com/v2/checkout-sessions
    // However, the project is currently integrated with checkout.cooud.com/api/v1 which uses /create-payment-intent.
    // I will try to follow the user's specific endpoint if possible, but the current functional code uses:
    // THREEB_BASE_URL + "/create-payment-intent"
    
    // Let's check if we should use the v2 endpoints the user mentioned.
    // If I use v2, I might need to change the whole logic.
    // I'll stick to the user's requested v2 endpoints as they provided a reference doc.
    
    const API_BASE = "https://api.cooud.com/v2";

    // 1. Create Session
    const sessionRes = await fetch(`${API_BASE}/checkout-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        product_id: data.productId,
        customer_email: data.buyerEmail,
        quantity: data.quantity,
      }),
    });

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      throw new Error(`Cooud Session Error: ${errorText}`);
    }

    const session = await sessionRes.json();
    const sessionId = session.id;

    // 2. Get Element Config
    const configRes = await fetch(`${API_BASE}/checkout-sessions/${sessionId}/element-config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
    });

    if (!configRes.ok) {
      const errorText = await configRes.text();
      throw new Error(`Cooud Config Error: ${errorText}`);
    }

    const config = await configRes.json();
    
    return {
      cooud_element_token: config.cooud_element_token,
      cooud_session_secret: config.cooud_session_secret,
      sessionId: sessionId
    };
  });
