"use client";

import { useState, useCallback } from "react";
import type { QueryRow } from "@/lib/api";
import DatePicker from "./DatePicker";
import StatsCards from "./StatsCards";
import MonthlyChart from "./MonthlyChart";
import SpendChart from "./SpendChart";
import CampaignTable from "./CampaignTable";
import DonationsPanel from "./DonationsPanel";
import MailchimpTable from "./MailchimpTable";

export interface DashboardData {
  fbMonthly: QueryRow[];
  fbCampaigns: QueryRow[];
  ga4Monthly: QueryRow[];
  gadsCampaigns: QueryRow[];
  donationsByCategory: QueryRow[];
  donationsMonthly: QueryRow[];
  donationsMonthlyByCategory: QueryRow[];
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header + Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Samusocial Brussels — Reporting
          </h2>
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

      <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
        {/* KPI Cards */}
        <StatsCards
          fbData={data.fbMonthly}
          ga4Data={data.ga4Monthly}
          gadsData={data.gadsCampaigns}
        />

        {/* Donations section */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">
            Donations — E-commerce GA4
          </h2>
          <DonationsPanel
            byCategory={data.donationsByCategory}
            monthlyTotals={data.donationsMonthly}
            monthlyByCategory={data.donationsMonthlyByCategory}
          />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-5 gap-6 mt-6">
          <div className="lg:col-span-3">
            <MonthlyChart fbMonthly={data.fbMonthly} ga4Monthly={data.ga4Monthly} />
          </div>
          <div className="lg:col-span-2">
            <SpendChart fbData={data.fbMonthly} gadsData={data.gadsCampaigns} />
          </div>
        </div>

        {/* Campaign tables */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <CampaignTable
            title="Campagnes Meta Ads"
            platform="Facebook & Instagram"
            color="#1877F2"
            rows={data.fbCampaigns}
            columns={[
              { key: "campaign_name", label: "Campagne", format: "text" },
              { key: "spend", label: "Dépenses", format: "currency" },
              { key: "impressions", label: "Impr.", format: "number" },
              { key: "actions:link_click", label: "Link clicks", format: "number" },
              { key: "actions:landing_page_view", label: "LP Views", format: "number" },
              { key: "ctr", label: "CTR", format: "percent" },
              { key: "cost_per_action_type:link_click", label: "CPC (link)", format: "currency" },
            ]}
          />
          <CampaignTable
            title="Campagnes Google Ads"
            platform="Search & Performance Max"
            color="#4285F4"
            rows={data.gadsCampaigns}
            columns={[
              { key: "campaign.name", label: "Campagne", format: "text" },
              { key: "metrics.cost_micros", label: "Dépenses", format: "currency" },
              { key: "metrics.impressions", label: "Impr.", format: "number" },
              { key: "metrics.clicks", label: "Clics", format: "number" },
              { key: "metrics.ctr", label: "CTR", format: "percent" },
              { key: "metrics.conversions", label: "Conv.", format: "number" },
            ]}
          />
        </div>

        {/* Mailchimp section */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">
            Performance Email — Mailchimp
          </h2>
          <MailchimpTable campaigns={data.mailchimpCampaigns} />
        </div>
      </div>
    </div>
  );
}
