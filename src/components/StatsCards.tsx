"use client";

import { DollarSign, Eye, MousePointer, Users, Clock, BarChart3, Target, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent, formatDuration } from "@/lib/format";
import type { QueryRow } from "@/lib/api";

interface StatsCardsProps {
  fbData: QueryRow[];
  ga4Data: QueryRow[];
  gadsData: QueryRow[];
}

export default function StatsCards({ fbData, ga4Data, gadsData }: StatsCardsProps) {
  // Facebook Ads totals
  const fbSpend = fbData.reduce((s, r) => s + (Number(r.spend) || 0), 0);
  const fbImpressions = fbData.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
  const fbClicks = fbData.reduce((s, r) => s + (Number(r.clicks) || 0), 0);

  // Google Ads totals
  const gadsSpend = gadsData.reduce((s, r) => s + (Number(r["metrics.cost_micros"]) || 0), 0);
  const gadsClicks = gadsData.reduce((s, r) => s + (Number(r["metrics.clicks"]) || 0), 0);
  const gadsConversions = gadsData.reduce((s, r) => s + (Number(r["metrics.conversions"]) || 0), 0);

  // GA4 totals
  const ga4Sessions = ga4Data.reduce((s, r) => s + (Number(r.sessions) || 0), 0);
  const ga4Users = ga4Data.reduce((s, r) => s + (Number(r.activeUsers) || 0), 0);
  const ga4Pageviews = ga4Data.reduce((s, r) => s + (Number(r.screenPageViews) || 0), 0);
  const ga4AvgDuration =
    ga4Data.reduce((s, r) => s + (Number(r.averageSessionDuration) || 0), 0) / (ga4Data.length || 1);
  const ga4BounceRate =
    ga4Data.reduce((s, r) => s + (Number(r.bounceRate) || 0), 0) / (ga4Data.length || 1);

  const totalSpend = fbSpend + gadsSpend;

  const cards = [
    {
      label: "Budget total",
      value: formatCurrency(totalSpend),
      sub: `Meta ${formatCurrency(fbSpend)} · Google ${formatCurrency(gadsSpend)}`,
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Impressions (Meta)",
      value: formatNumber(fbImpressions),
      sub: `${formatNumber(fbClicks)} clics`,
      icon: Eye,
      color: "text-[#1877F2]",
      bg: "bg-[#1877F2]/10",
    },
    {
      label: "Clics (Google Ads)",
      value: formatNumber(gadsClicks),
      sub: `${formatNumber(gadsConversions)} conversions`,
      icon: MousePointer,
      color: "text-[#4285F4]",
      bg: "bg-[#4285F4]/10",
    },
    {
      label: "Sessions (GA4)",
      value: formatNumber(ga4Sessions),
      sub: `${formatNumber(ga4Pageviews)} pages vues`,
      icon: BarChart3,
      color: "text-[#E37400]",
      bg: "bg-[#E37400]/10",
    },
    {
      label: "Utilisateurs actifs",
      value: formatNumber(ga4Users),
      sub: "GA4",
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Durée moy. session",
      value: formatDuration(ga4AvgDuration),
      sub: "GA4",
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Taux de rebond",
      value: formatPercent(ga4BounceRate),
      sub: "GA4",
      icon: TrendingUp,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Conversions Google",
      value: formatNumber(gadsConversions),
      sub: `CPA ${gadsConversions > 0 ? formatCurrency(gadsSpend / gadsConversions) : "—"}`,
      icon: Target,
      color: "text-error",
      bg: "bg-error/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
              {card.label}
            </span>
            <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-text-muted mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
