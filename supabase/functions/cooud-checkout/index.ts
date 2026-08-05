import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { productId, buyerEmail, quantity = 1 } = await req.json();
    const apiKey = Deno.env.get("COOUD_SECRET_KEY");

    if (!apiKey) {
      throw new Error("COOUD_SECRET_KEY not set");
    }

    // 1. Create Checkout Session
    const sessionRes = await fetch("https://api.cooud.com/v2/checkout-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_id: productId,
        customer_email: buyerEmail,
        quantity: quantity,
        // Add other necessary fields as per Cooud docs if needed
      }),
    });

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      console.error("Cooud Session Error:", errorText);
      throw new Error(`Cooud Session Error: ${errorText}`);
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.id;

    // 2. Get Element Config
    const configRes = await fetch(`https://api.cooud.com/v2/checkout-sessions/${sessionId}/element-config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!configRes.ok) {
      const errorText = await configRes.text();
      console.error("Cooud Config Error:", errorText);
      throw new Error(`Cooud Config Error: ${errorText}`);
    }

    const configData = await configRes.json();

    return new Response(JSON.stringify(configData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
