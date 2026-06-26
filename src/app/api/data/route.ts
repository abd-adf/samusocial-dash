import { NextRequest, NextResponse } from "next/server";
import {
  queryFacebookAds,
  queryGA4,
  queryGoogleAds,
  queryMailchimp,
} from "@/lib/api";

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateFrom = searchParams.get("from") || "2025-11-01";
  const dateTo = searchParams.get("to") || "2025-12-31";

  // Y-1: shift dates back one year
  const prevFrom = dateFrom.replace(/^\d{4}/, (y) => String(Number(y) - 1));
  const prevTo = dateTo.replace(/^\d{4}/, (y) => String(Number(y) - 1));

  try {
    // All API calls in parallel (current + Y-1 donations)
    const [
      fbMonthly, fbCampaigns, ga4Monthly, gadsCampaigns,
      donationsByCategory, donationsMonthly, donationsMonthlyByCategory,
      mailchimpCampaigns,
      prevDonationsByCategory, prevDonationsMonthly, prevDonationsMonthlyByCategory,
    ] = await Promise.all([
      queryFacebookAds(dateFrom, dateTo, FB_MONTHLY_FIELDS, ["month"]),
      queryFacebookAds(dateFrom, dateTo, FB_CAMPAIGN_FIELDS, ["campaign_name"]),
      queryGA4(dateFrom, dateTo, ["month", "sessions", "activeUsers", "newUsers", "screenPageViews", "bounceRate", "averageSessionDuration", "conversions"], ["month"]),
      queryGoogleAds(dateFrom, dateTo, GADS_FIELDS, ["campaign.name"]),
      queryGA4(dateFrom, dateTo, ["itemCategory", "itemRevenue", "itemsPurchased"], ["itemCategory"]),
      queryGA4(dateFrom, dateTo, ["month", "totalRevenue", "ecommercePurchases", "transactions", "purchaseRevenue", "averagePurchaseRevenue"], ["month"]),
      queryGA4(dateFrom, dateTo, ["month", "itemCategory", "itemRevenue", "itemsPurchased"], ["month", "itemCategory"]),
      queryMailchimp(dateFrom, dateTo, ["campaignName", "sendTime", "emailsSent", "opens", "uniqueOpens", "openRate", "clicks", "uniqueClicks", "clickRate", "bounces", "unsubscribed"], ["campaignName"]),
      // Y-1 donations
      queryGA4(prevFrom, prevTo, ["itemCategory", "itemRevenue", "itemsPurchased"], ["itemCategory"]),
      queryGA4(prevFrom, prevTo, ["month", "totalRevenue", "ecommercePurchases", "transactions", "purchaseRevenue", "averagePurchaseRevenue"], ["month"]),
      queryGA4(prevFrom, prevTo, ["month", "itemCategory", "itemRevenue", "itemsPurchased"], ["month", "itemCategory"]),
    ]);

    return NextResponse.json({
      fbMonthly: fbMonthly.rows,
      fbCampaigns: fbCampaigns.rows,
      ga4Monthly: ga4Monthly.rows,
      gadsCampaigns: gadsCampaigns.rows,
      donationsByCategory: donationsByCategory.rows,
      donationsMonthly: donationsMonthly.rows,
      donationsMonthlyByCategory: donationsMonthlyByCategory.rows,
      mailchimpCampaigns: mailchimpCampaigns.rows,
      prevDonationsByCategory: prevDonationsByCategory.rows,
      prevDonationsMonthly: prevDonationsMonthly.rows,
      prevDonationsMonthlyByCategory: prevDonationsMonthlyByCategory.rows,
      dateRange: { start: dateFrom, end: dateTo },
    });
  } catch (error) {
    console.error("API fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
