"use client";

import Image from "next/image";
import type { QueryRow } from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

interface CampaignTableProps {
  title: string;
  platform: string;
  logo?: string;
  color: string;
  rows: QueryRow[];
  columns: {
    key: string;
    label: string;
    format: "currency" | "number" | "percent" | "text";
  }[];
}

export default function CampaignTable({ title, platform, logo, color, rows, columns }: CampaignTableProps) {
  const formatValue = (value: unknown, format: string) => {
    const num = Number(value);
    switch (format) {
      case "currency":
        return formatCurrency(num);
      case "number":
        return formatNumber(num);
      case "percent":
        return formatPercent(num);
      default:
        return String(value ?? "—");
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        {logo ? (
          <Image src={logo} alt={title} width={80} height={24} className="h-6 w-auto" />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        )}
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-text-muted">{platform}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-surface-hover transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 whitespace-nowrap ${
                      col.format === "text"
                        ? "font-medium text-foreground max-w-[250px] truncate"
                        : "text-right tabular-nums text-text-muted"
                    }`}
                  >
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                  Aucune donnée disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
