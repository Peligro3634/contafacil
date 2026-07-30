// Extrae monto/fecha/nota de un comprobante (foto o PDF) via Claude Sonnet
// con vision, siguiendo el mismo patron probado en produccion en otro
// proyecto (WhatsApp Invoice/Transfer Tracker): SDK oficial de Anthropic,
// content block base64 (image o document segun el mime type), prompt que
// pide JSON puro, parseo con reintentos, y logging de tokens de uso.
//
// No hace OCR tradicional: todo el parsing lo hace el modelo directamente
// sobre la imagen/PDF.
//
// Requiere el secret ANTHROPIC_API_KEY configurado en el proyecto de
// Supabase (Edge Functions > Secrets). SUPABASE_URL / SUPABASE_ANON_KEY los
// inyecta la plataforma automaticamente.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";

const EXTRACTION_PROMPT = `Sos un asistente que extrae datos de comprobantes financieros (ventas, transferencias, gastos) a partir de una imagen o PDF. Te van a pasar un documento y tenés que devolver ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin explicaciones, sin bloques de markdown (nada de \`\`\`json), que cumpla exactamente este schema:

{
  "amount": number | null,
  "date": string | null,
  "note": string | null,
  "confidence": "alta" | "media" | "baja",
  "requires_review": boolean,
  "review_reason": string | null
}

Reglas:
- Devolvé SOLO el JSON. Nada antes ni después, ni bloques de código.
- amount: monto total del comprobante como número puro (sin símbolo de moneda, sin separador de miles, punto para decimales). null si no se puede determinar.
- date: fecha del comprobante en formato YYYY-MM-DD. null si no se puede determinar.
- note: descripción breve y útil (comercio, concepto, quién envía/recibe), máximo 140 caracteres. null si no hay información relevante.
- No inventes valores: si un dato no está visible o es ilegible, usá null en ese campo y marcá requires_review en true.
- Si el documento no parece ser un comprobante financiero (venta, transferencia, factura, ticket), marcá requires_review true y explicá por qué en review_reason.`;

interface ExtractionResult {
  amount: number | null;
  date: string | null;
  note: string | null;
  confidence: "alta" | "media" | "baja";
  requires_review: boolean;
  review_reason: string | null;
}

function validateExtraction(parsed: unknown): ExtractionResult {
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("la respuesta no es un objeto JSON");
  }
  const p = parsed as Record<string, unknown>;

  if (p.amount !== null && typeof p.amount !== "number") throw new Error("amount invalido");
  if (p.date !== null && typeof p.date !== "string") throw new Error("date invalido");
  if (p.note !== null && typeof p.note !== "string") throw new Error("note invalido");
  if (!["alta", "media", "baja"].includes(p.confidence as string)) throw new Error("confidence invalido");
  if (typeof p.requires_review !== "boolean") throw new Error("requires_review invalido");
  if (p.review_reason !== null && typeof p.review_reason !== "string") throw new Error("review_reason invalido");

  return {
    amount: (p.amount as number | null) ?? null,
    date: (p.date as string | null) ?? null,
    note: (p.note as string | null) ?? null,
    confidence: p.confidence as "alta" | "media" | "baja",
    requires_review: p.requires_review as boolean,
    review_reason: (p.review_reason as string | null) ?? null,
  };
}

function parseClaudeJson(rawText: string): unknown {
  const cleaned = rawText
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "no autenticado" }), { status: 401 });
  }

  let receiptId: string | undefined;
  try {
    ({ receiptId } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "body invalido" }), { status: 400 });
  }
  if (!receiptId) {
    return new Response(JSON.stringify({ error: "receiptId requerido" }), { status: 400 });
  }

  // Cliente scopeado con el JWT del usuario: RLS decide que puede leer/tocar
  // (su propio receipt, su propio archivo en storage).
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("id, file_path")
    .eq("id", receiptId)
    .single();
  if (receiptError || !receipt) {
    return new Response(JSON.stringify({ error: "comprobante no encontrado" }), { status: 404 });
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("receipts")
    .download(receipt.file_path);
  if (downloadError || !fileBlob) {
    return new Response(JSON.stringify({ error: "no se pudo descargar el archivo" }), { status: 500 });
  }

  const mediaType = fileBlob.type || "application/octet-stream";
  const bytes = new Uint8Array(await fileBlob.arrayBuffer());
  const base64Data = encodeBase64(bytes);

  const contentBlock = mediaType === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } }
    : { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } };

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  let extraction: ExtractionResult | null = null;
  let lastError: string | null = null;
  let usage = { input_tokens: 0, output_tokens: 0 };

  // Hasta 2 intentos: cubre tanto una respuesta que no parsea como una
  // llamada a la API que falla (rate limit, error transitorio, etc.).
  for (let attempt = 0; attempt < 2 && !extraction; attempt++) {
    try {
      // deno-lint-ignore no-explicit-any
      const message = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [contentBlock, { type: "text", text: EXTRACTION_PROMPT }],
          },
        ],
      } as any);

      usage = {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      };

      const textBlock = message.content.find((b: { type: string }) => b.type === "text") as
        | { type: "text"; text: string }
        | undefined;
      if (!textBlock) throw new Error("la respuesta no tiene texto");

      extraction = validateExtraction(parseClaudeJson(textBlock.text));
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  if (!extraction) {
    extraction = {
      amount: null,
      date: null,
      note: null,
      confidence: "baja",
      requires_review: true,
      review_reason: `No se pudo extraer datos automaticamente: ${lastError ?? "respuesta invalida"}`,
    };
  }

  const { error: updateError } = await supabase
    .from("receipts")
    .update({
      extracted_amount: extraction.amount,
      extracted_date: extraction.date,
      extracted_note: extraction.note,
      confidence: extraction.confidence,
      requires_review: extraction.requires_review,
      review_reason: extraction.review_reason,
      extraction_input_tokens: usage.input_tokens,
      extraction_output_tokens: usage.output_tokens,
    })
    .eq("id", receiptId);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ...extraction, usage }), {
    headers: { "Content-Type": "application/json" },
  });
});
