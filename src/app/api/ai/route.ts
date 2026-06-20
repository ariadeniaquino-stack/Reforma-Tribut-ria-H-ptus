import type { NextRequest } from "next/server";
import { buildReportPrompt } from "@/application/services/AiPrompt";
import type { AiContext } from "@/domain/models/AiTypes";

export const runtime = "nodejs";

const MAX_PAYLOAD = 20 * 1024; // 20KB

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // same-origin requests podem não enviar Origin
  try {
    const host = new URL(origin).hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host.endsWith(".vercel.app")) return true;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && origin.startsWith(appUrl)) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY não configurada no servidor." }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  if (!isOriginAllowed(req.headers.get("origin"))) {
    return new Response(JSON.stringify({ error: "Origem não autorizada." }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const rawBody = await req.text();
  if (rawBody.length > MAX_PAYLOAD) {
    return new Response(JSON.stringify({ error: "Payload excede o limite (20KB)." }), {
      status: 413,
      headers: { "content-type": "application/json" },
    });
  }

  let context: AiContext;
  let model = "gemini-2.0-flash";
  let maxOutputTokens = 8192;
  let companyName: string | undefined;
  try {
    const body = JSON.parse(rawBody);
    context = body.context;
    if (body.model) model = String(body.model);
    if (body.maxTokens) maxOutputTokens = Number(body.maxTokens);
    companyName = body.companyName;
    if (!context || typeof context !== "object") throw new Error("contexto ausente");
  } catch {
    return new Response(JSON.stringify({ error: "Corpo inválido." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const prompt = buildReportPrompt(context, companyName);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const geminiRes = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens, temperature: 0.4 },
    }),
  });

  if (!geminiRes.ok || !geminiRes.body) {
    const detail = await geminiRes.text().catch(() => "");
    const status = geminiRes.status;
    const msg =
      status === 429
        ? "Limite de requisições do Gemini atingido. Aguarde um instante."
        : status === 403
          ? "Chave do Gemini inválida ou sem permissão."
          : `Erro do Gemini (${status}).`;
    return new Response(JSON.stringify({ error: msg, detail: detail.slice(0, 300) }), {
      status,
      headers: { "content-type": "application/json" },
    });
  }

  // Reemite apenas o texto, tratando o buffer SSE (split por \n\n).
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const text = parsed?.candidates?.[0]?.content?.parts
                ?.map((p: { text?: string }) => p.text ?? "")
                .join("");
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // fragmento incompleto — ignorado
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
