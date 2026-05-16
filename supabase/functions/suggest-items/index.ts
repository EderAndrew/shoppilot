import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth validation
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  // Parse and validate body
  let body: { prompt?: unknown; context?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  const { prompt, context } = body;

  if (!prompt || typeof prompt !== "string" || prompt.length > 500) {
    return jsonResponse({ error: "invalid_request" }, 400);
  }

  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  const ctx = context as { listName?: string; existingItemNames?: string[] } | undefined;
  const systemPrompt = `Você é um assistente de compras para supermercados brasileiros.
O usuário está montando uma lista chamada "${ctx?.listName ?? "Lista"}".
Itens já na lista: ${ctx?.existingItemNames?.join(", ") || "nenhum"}.
Responda APENAS com um objeto JSON válido seguindo EXATAMENTE este schema:
{"suggestions":[{"name":"string","quantity":integer,"unit":"string opcional","category":"string opcional","notes":"string opcional"}]}
Sugira 5 a 15 itens relevantes. Não repita itens já presentes na lista.`;

  let aiResponse: Response;
  try {
    aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    return jsonResponse({ error: "ai_service_unavailable" }, 503);
  }

  if (!aiResponse.ok) {
    return jsonResponse({ error: "ai_service_unavailable" }, 503);
  }

  const aiData = await aiResponse.json();
  const text = aiData.content?.[0]?.text ?? "{}";

  let parsed: { suggestions: unknown[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    return jsonResponse({ error: "unprocessable_response" }, 422);
  }

  return jsonResponse(parsed);
});
