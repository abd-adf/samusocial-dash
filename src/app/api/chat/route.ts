import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      history,
      dashboardData,
      dateRange,
    }: {
      message: string;
      history: { role: string; content: string }[];
      dashboardData: unknown;
      dateRange: { start: string; end: string };
    } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.CHAT_AI_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CHAT_AI_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const dateFrom = dateRange?.start || "2025-11-01";
    const dateTo = dateRange?.end || "2025-12-31";

    // Build system prompt with data passed from client
    const systemPrompt = `Tu es un analyste digital expert pour le Samusocial de Bruxelles. Tu analyses les données du dashboard de reporting digital. Réponds de façon concise et précise en français. Utilise des chiffres précis tirés des données. Formate les montants en euros et les pourcentages correctement.

Voici les données actuelles du dashboard pour la période du ${dateFrom} au ${dateTo} :

${JSON.stringify(dashboardData, null, 2)}`;

    // Build messages array from history + current message
    const messages: { role: "user" | "assistant"; content: string }[] = [];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: message });

    // Create Anthropic client and stream response
    const anthropic = new Anthropic({ apiKey });

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorMsg = error instanceof Error ? error.message : "Unknown streaming error";
          controller.enqueue(encoder.encode(`\n\n[Erreur: ${errorMsg}]`));
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
