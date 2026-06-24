import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  queryFacebookAds,
  queryGA4,
  queryGoogleAds,
  queryMailchimp,
} from "@/lib/api";

// ── Field configs (same as data route) ──────────────────────────────────────

const FB_CAMPAIGN_FIELDS = [
  "campaign_name", "spend", "impressions", "clicks", "ctr", "cpc",
  "reach", "frequency",
  "actions:link_click", "cost_per_action_type:link_click",
  "actions:landing_page_view",
  "actions:omni_purchase", "action_values:omni_purchase",
  "cost_per_action_type:omni_purchase", "purchase_roas:omni_purchase",
];

const FB_MONTHLY_FIELDS = [
  "month", "spend", "impressions", "clicks", "ctr", "cpc",
  "reach", "frequency",
  "actions:link_click", "cost_per_action_type:link_click",
  "actions:landing_page_view",
  "actions:omni_purchase", "action_values:omni_purchase",
];

const GADS_FIELDS = [
  "campaign.name", "metrics.cost_micros", "metrics.impressions",
  "metrics.clicks", "metrics.ctr", "metrics.average_cpc",
  "metrics.conversions", "metrics.conversions_value",
  "metrics.absolute_top_impression_percentage",
  "metrics.top_impression_percentage",
];

// ── Fetch all dashboard data ────────────────────────────────────────────────

async function fetchDashboardData(dateFrom: string, dateTo: string) {
  // Batch 1: Facebook Ads
  const [fbMonthly, fbCampaigns] = await Promise.all([
    queryFacebookAds(dateFrom, dateTo, FB_MONTHLY_FIELDS, ["month"]),
    queryFacebookAds(dateFrom, dateTo, FB_CAMPAIGN_FIELDS, ["campaign_name"]),
  ]);

  // Batch 2: GA4 traffic + Google Ads
  const [ga4Monthly, gadsCampaigns] = await Promise.all([
    queryGA4(
      dateFrom, dateTo,
      ["month", "sessions", "activeUsers", "newUsers", "screenPageViews", "bounceRate", "averageSessionDuration", "conversions"],
      ["month"],
    ),
    queryGoogleAds(dateFrom, dateTo, GADS_FIELDS, ["campaign.name"]),
  ]);

  // Batch 3: Donations + Mailchimp
  const [donationsByCategory, donationsMonthly, donationsMonthlyByCategory, donationsByChannel, mailchimpCampaigns] =
    await Promise.all([
      queryGA4(dateFrom, dateTo, ["itemCategory", "itemRevenue", "itemsPurchased"], ["itemCategory"]),
      queryGA4(dateFrom, dateTo, ["month", "totalRevenue", "ecommercePurchases", "transactions", "purchaseRevenue", "averagePurchaseRevenue"], ["month"]),
      queryGA4(dateFrom, dateTo, ["month", "itemCategory", "itemRevenue", "itemsPurchased"], ["month", "itemCategory"]),
      queryGA4(dateFrom, dateTo, ["sessionManualSource", "sessionManualMedium", "sessionManualCampaignName", "transactions", "purchaseRevenue"], ["sessionManualSource", "sessionManualMedium", "sessionManualCampaignName"]),
      queryMailchimp(
        dateFrom, dateTo,
        ["campaignName", "sendTime", "emailsSent", "opens", "uniqueOpens", "openRate", "clicks", "uniqueClicks", "clickRate", "bounces", "unsubscribed"],
        ["campaignName"],
      ),
    ]);

  return {
    fbMonthly: fbMonthly.rows,
    fbCampaigns: fbCampaigns.rows,
    ga4Monthly: ga4Monthly.rows,
    gadsCampaigns: gadsCampaigns.rows,
    donationsByCategory: donationsByCategory.rows,
    donationsMonthly: donationsMonthly.rows,
    donationsMonthlyByCategory: donationsMonthlyByCategory.rows,
    donationsByChannel: donationsByChannel.rows,
    mailchimpCampaigns: mailchimpCampaigns.rows,
    dateRange: { start: dateFrom, end: dateTo },
  };
}

// ── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      history,
      dateRange,
    }: {
      message: string;
      history: { role: string; content: string }[];
      dateRange: { start: string; end: string };
    } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch current dashboard data for context
    const dateFrom = dateRange?.start || "2025-11-01";
    const dateTo = dateRange?.end || "2025-12-31";

    let dashboardData;
    try {
      dashboardData = await fetchDashboardData(dateFrom, dateTo);
    } catch (dataError) {
      console.error("Failed to fetch dashboard data for chat context:", dataError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch dashboard data" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Build system prompt with data context
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

    // Stream the response using the SDK's built-in event iterator
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
