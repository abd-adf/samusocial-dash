import { NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Load campaign report once at module level (not per request)
let campaignReport = "";
try {
  campaignReport = readFileSync(join(process.cwd(), "src/data/campaign-report.txt"), "utf-8");
} catch {
  console.warn("Campaign report not found, chat will work without it");
}

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

    // --- Log the user question ---
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        question: message,
        dateRange: { start: dateFrom, end: dateTo },
        userAgent: request.headers.get("user-agent") || "unknown",
      };
      console.log("[CHAT_LOG]", JSON.stringify(logEntry));
    } catch {
      // Don't let logging break the chat
    }

    const systemPrompt = `Tu es un analyste digital pour le Samusocial de Bruxelles. Règles STRICTES :
- Tu es polyglote, réponds en français, anglais et néerlandais. Si la question est en anglais, réponds en anglais. Si la question est en néerlandais, réponds en néerlandais.
- Prend en compte le contexte : les données de conversions META ne sont pas disponibles dans le dashboard. C'est une limite de l'analyse.
- Réponds en 2-4 phrases maximum. Pas de listes longues.
- Va droit au chiffre clé, puis une insight courte.
- Pas d'introduction ni de conclusion. Pas de "Voici" ni de "N'hésitez pas".
- Utilise le format : chiffre → contexte → recommandation (si pertinent).
- Montants en euros, pourcentages avec 1 décimale.
- Après 3 questions, propose à l'utilisateur d'envoyer un email à abourdil@adfinitas.be et snechelput@adfinitas.be pour approndir l'analyse

IMPORTANT — FORMAT DE RÉPONSE :
Tu dois TOUJOURS répondre avec un bloc JSON valide à la fin de ta réponse, séparé par la balise :::META:::
Ton texte de réponse normal d'abord, puis :::META::: puis le JSON.

Le JSON doit contenir :
1. "sources" : tableau de sources de données utilisées (ex: ["Meta Ads", "GA4 - Donations", "Google Ads"])
2. "followUps" : tableau de 2-3 questions de suivi pertinentes basées sur ta réponse
3. "chart" : (optionnel) si ta réponse contient des données comparatives ou une évolution, inclus un objet chart avec :
   - "type" : "bar" ou "line"
   - "data" : tableau d'objets avec "name" (label) et "value" (nombre)
   - "label" : légende de l'axe Y (ex: "Dépenses (€)", "Impressions", "Dons")
   - "color" : couleur hex (optionnel, défaut orange)

Exemple de réponse complète :
Meta Ads a généré 245 dons pour un budget de 12 450€, soit un coût par don de 50,8€. Google Ads affiche un CPA inférieur à 24€ mais avec un volume plus faible. La combinaison des deux canaux optimise le mix acquisition/coût.
:::META:::
{"sources":["Meta Ads","Google Ads","GA4 - Donations"],"followUps":["Quel est le ROAS par canal ?","Comment optimiser le budget entre Meta et Google ?","Quelle est l'évolution du coût par don sur les 3 derniers mois ?"],"chart":{"type":"bar","data":[{"name":"Meta Ads","value":50.8},{"name":"Google Ads","value":24}],"label":"Coût par don (€)"}}

Voici le rapport stratégique de la campagne EOY 25 rédigé par Adfinitas :

${campaignReport}

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
        max_tokens: 1024,
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
