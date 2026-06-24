import { NextRequest, NextResponse } from "next/server";
import {
  queryFacebookAds,
  queryGA4,
  queryGoogleAds,
  queryMailchimp,
} from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateFrom = searchParams.get("from") || "2025-11-01";
  const dateTo = searchParams.get("to") || "2025-12-31";

  try {
    const [fbMonthly, fbCampaigns, ga4Monthly, gadsCampaigns, mailchimpCampaigns] =
      await Promise.all([
        queryFacebookAds(
          dateFrom,
          dateTo,
          [
            "month",
            "spend",
            "impressions",
            "clicks",
            "ctr",
            "cpc",
            "actions:link_click",
            "cost_per_action_type:link_click",
            "actions:landing_page_view",
          ],
          ["month"],
        ),
        queryFacebookAds(
          dateFrom,
          dateTo,
          [
            "campaign_name",
            "spend",
            "impressions",
            "clicks",
            "ctr",
            "cpc",
            "actions:link_click",
            "cost_per_action_type:link_click",
            "actions:landing_page_view",
          ],
          ["campaign_name"],
        ),
        queryGA4(
          dateFrom,
          dateTo,
          [
            "month",
            "sessions",
            "activeUsers",
            "newUsers",
            "screenPageViews",
            "bounceRate",
            "averageSessionDuration",
            "conversions",
          ],
          ["month"],
        ),
        queryGoogleAds(
          dateFrom,
          dateTo,
          [
            "campaign.name",
            "metrics.cost_micros",
            "metrics.impressions",
            "metrics.clicks",
            "metrics.ctr",
            "metrics.average_cpc",
            "metrics.conversions",
            "metrics.conversions_value",
          ],
          ["campaign.name"],
        ),
        queryMailchimp(
          dateFrom,
          dateTo,
          [
            "campaignName",
            "sendTime",
            "emailsSent",
            "opens",
            "uniqueOpens",
            "openRate",
            "clicks",
            "uniqueClicks",
            "clickRate",
            "bounces",
            "unsubscribed",
          ],
          ["campaignName"],
        ),
      ]);

    return NextResponse.json({
      fbMonthly: fbMonthly.rows,
      fbCampaigns: fbCampaigns.rows,
      ga4Monthly: ga4Monthly.rows,
      gadsCampaigns: gadsCampaigns.rows,
      mailchimpCampaigns: mailchimpCampaigns.rows,
      dateRange: { start: dateFrom, end: dateTo },
    });
  } catch (error) {
    console.error("API fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
