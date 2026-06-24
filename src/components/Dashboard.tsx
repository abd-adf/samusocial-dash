"use client";

import { useState, useCallback } from "react";
import { Heart, Megaphone, LayoutList } from "lucide-react";
import type { QueryRow } from "@/lib/api";
import DatePicker from "./DatePicker";
import SectionHeader from "./SectionHeader";
import DonationsPanel from "./DonationsPanel";
import BrandBuildingPanel from "./BrandBuildingPanel";
import CampaignTable from "./CampaignTable";
import MailchimpTable from "./MailchimpTable";

export interface DashboardData {
  fbMonthly: QueryRow[];
  fbCampaigns: QueryRow[];
  ga4Monthly: QueryRow[];
  gadsCampaigns: QueryRow[];
  donationsByCategory: QueryRow[];
  donationsMonthly: QueryRow[];
  donationsMonthlyByCategory: QueryRow[];
  donationsByChannel: QueryRow[];
  mailchimpCampaigns: QueryRow[];
  dateRange: { start: string; end: string };
}

interface DashboardProps {
  initialData: DashboardData;
}

export default function Dashboard({ initialData }: DashboardProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(
    new Date().toLocaleDateString("fr-BE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const handleDateChange = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Fetch failed");
      const newData: DashboardData = await res.json();
      setData(newData);
      setLastUpdated(
        new Date().toLocaleDateString("fr-BE", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Header + Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-text-muted">
            Période : {data.dateRange.start} au {data.dateRange.end} · Mis à jour le{" "}
            {lastUpdated}
          </p>
        </div>
        <DatePicker
          dateFrom={data.dateRange.start}
          dateTo={data.dateRange.end}
          onApply={handleDateChange}
          loading={loading}
        />
      </div>

      <div className={loading ? "opacity-50 pointer-events-none transition-opacity space-y-10" : "transition-opacity space-y-10"}>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — PERFORMANCE FUNDRAISING
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="Performance Fundraising"
            subtitle="Dons en ligne — données e-commerce GA4"
            icon={Heart}
            color="#10b981"
          />
          <DonationsPanel
            byCategory={data.donationsByCategory}
            monthlyTotals={data.donationsMonthly}
            monthlyByCategory={data.donationsMonthlyByCategory}
            byChannel={data.donationsByChannel}
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — PERFORMANCE BRAND BUILDING
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="Performance Brand Building"
            subtitle="Portée, fréquence & disponibilité mentale — framework Byron Sharp"
            icon={Megaphone}
            color="#8b5cf6"
          />
          <BrandBuildingPanel
            fbData={data.fbCampaigns}
            gadsData={data.gadsCampaigns}
            ga4Data={data.ga4Monthly}
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — DÉTAIL PAR CAMPAGNE
        ═══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="Détail par campagne"
            subtitle="Performance détaillée par plateforme publicitaire et emailing"
            icon={LayoutList}
            color="#21365e"
          />

          <div className="space-y-6">
            {/* Meta Ads campaigns */}
            <CampaignTable
              title="Campagnes Meta Ads"
              platform="Facebook & Instagram"
              logo="/logos/meta.png"
              color="#1877F2"
              rows={data.fbCampaigns}
              columns={[
                { key: "campaign_name", label: "Campagne", format: "text" },
                { key: "spend", label: "Dépenses", format: "currency" },
                { key: "impressions", label: "Impressions", format: "number" },
                { key: "reach", label: "Reach", format: "number" },
                { key: "clicks", label: "Clics", format: "number" },
                { key: "actions:landing_page_view", label: "LP Views", format: "number" },
                { key: "ctr", label: "CTR", format: "percent" },
                { key: "cpc", label: "CPC", format: "currency" },
              ]}
            />

            {/* Google Ads campaigns */}
            <CampaignTable
              title="Campagnes Google Ads"
              platform="Search & Performance Max"
              logo="/logos/google-ads.png"
              color="#4285F4"
              rows={data.gadsCampaigns}
              columns={[
                { key: "campaign.name", label: "Campagne", format: "text" },
                { key: "metrics.cost_micros", label: "Dépenses", format: "currency" },
                { key: "metrics.impressions", label: "Impressions", format: "number" },
                { key: "metrics.clicks", label: "Clics", format: "number" },
                { key: "metrics.ctr", label: "CTR", format: "percent" },
                { key: "metrics.conversions", label: "Conversions", format: "number" },
                { key: "metrics.top_impression_percentage", label: "Top Impr. %", format: "percent" },
              ]}
            />

            {/* Mailchimp campaigns */}
            <div>
              <MailchimpTable campaigns={data.mailchimpCampaigns} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
