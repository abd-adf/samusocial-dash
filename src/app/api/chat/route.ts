import { NextRequest } from "next/server";

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

    const systemPrompt = `Tu es un analyste digital expert pour le Samusocial de Bruxelles. Tu analyses les données du dashboard de reporting digital. Réponds de façon concise et précise en français. Utilise des chiffres précis tirés des données. Formate les montants en euros et les pourcentages correctement.

Voici les données actuelles du dashboard pour la période du ${dateFrom} au ${dateTo} :

${JSON.stringify(dashboardData, null, 2)}`;

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

    // Direct fetch to Anthropic API (avoids SDK issues with Netlify)
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", anthropicRes.status, errText);
      return new Response(
        JSON.stringify({ error: `API error: ${anthropicRes.status}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Stream SSE response back as plain text
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = anthropicRes.body?.getReader();

    const responseStream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const event = JSON.parse(data);
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta"
                ) {
                  controller.enqueue(encoder.encode(event.delta.text));
                }
              } catch {
                // skip non-JSON lines
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        }
        controller.close();
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
