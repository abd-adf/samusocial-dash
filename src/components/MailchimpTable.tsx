"use client";

import { Mail, Send, Eye, MousePointer, UserMinus } from "lucide-react";
import type { QueryRow } from "@/lib/api";
import { formatNumber, formatPercent } from "@/lib/format";

interface MailchimpTableProps {
  campaigns: QueryRow[];
}

export default function MailchimpTable({ campaigns }: MailchimpTableProps) {
  // Aggregate stats
  const totalSent = campaigns.reduce((s, r) => s + Number(r.emailsSent || 0), 0);
  const totalOpens = campaigns.reduce((s, r) => s + Number(r.uniqueOpens || 0), 0);
  const totalClicks = campaigns.reduce((s, r) => s + Number(r.uniqueClicks || 0), 0);
  const totalBounces = campaigns.reduce((s, r) => s + Number(r.bounces || 0), 0);
  const totalUnsubs = campaigns.reduce((s, r) => s + Number(r.unsubscribed || 0), 0);
  const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
  const avgClickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

  const kpis = [
    { label: "Emails envoyés", value: formatNumber(totalSent), icon: Send, color: "text-[#FFE01B]", bg: "bg-[#FFE01B]/15" },
    { label: "Ouvertures uniques", value: formatNumber(totalOpens), icon: Eye, color: "text-success", bg: "bg-success/10" },
    { label: "Clics uniques", value: formatNumber(totalClicks), icon: MousePointer, color: "text-primary", bg: "bg-primary/10" },
    { label: "Taux d'ouverture moy.", value: formatPercent(avgOpenRate), icon: Mail, color: "text-accent", bg: "bg-accent/10" },
    { label: "Taux de clic moy.", value: formatPercent(avgClickRate), icon: MousePointer, color: "text-[#4285F4]", bg: "bg-[#4285F4]/10" },
    { label: "Désabonnements", value: formatNumber(totalUnsubs), icon: UserMinus, color: "text-error", bg: "bg-error/10" },
  ];

  // Sort by sendTime desc
  const sorted = [...campaigns].sort(
    (a, b) => String(b.sendTime).localeCompare(String(a.sendTime))
  );

  const formatDate = (sendTime: string | number) => {
    const s = String(sendTime);
    if (s.length >= 8) {
      return `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`;
    }
    return s;
  };

  return (
    <div className="space-y-4">
      {/* Mailchimp KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface rounded-xl border border-border p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`${kpi.bg} ${kpi.color} p-1.5 rounded-md`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide">
                {kpi.label}
              </span>
            </div>
            <p className="text-xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Campaign table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFE01B]" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Campagnes Mailchimp
            </h3>
            <p className="text-xs text-text-muted">
              {campaigns.length} campagnes · New Samusocial asbl
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background/50">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                  Campagne
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Date
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Envoyés
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Ouvertures
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Taux ouv.
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Clics
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Taux clic
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Bounces
                </th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap">
                  Désab.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((row, i) => (
                <tr key={i} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground max-w-[300px] truncate">
                    {String(row.campaignName)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-muted whitespace-nowrap">
                    {formatDate(row.sendTime)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-muted">
                    {formatNumber(Number(row.emailsSent))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-muted">
                    {formatNumber(Number(row.uniqueOpens))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span
                      className={
                        Number(row.openRate) >= 40
                          ? "text-success"
                          : Number(row.openRate) >= 25
                          ? "text-warning"
                          : "text-error"
                      }
                    >
                      {formatPercent(Number(row.openRate))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-muted">
                    {formatNumber(Number(row.uniqueClicks))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span
                      className={
                        Number(row.clickRate) >= 2
                          ? "text-success"
                          : Number(row.clickRate) >= 1
                          ? "text-warning"
                          : "text-text-muted"
                      }
                    >
                      {formatPercent(Number(row.clickRate))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-muted">
                    {formatNumber(Number(row.bounces))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-text-muted">
                    {formatNumber(Number(row.unsubscribed))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
