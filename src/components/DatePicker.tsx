"use client";

import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";

interface DatePickerProps {
  dateFrom: string;
  dateTo: string;
  onApply: (from: string, to: string) => void;
  loading: boolean;
}

const PRESETS = [
  { label: "Nov-Déc 2025", from: "2025-11-01", to: "2025-12-31" },
  { label: "Déc 2025", from: "2025-12-01", to: "2025-12-31" },
  { label: "Nov 2025", from: "2025-11-01", to: "2025-11-30" },
  { label: "Oct-Déc 2025", from: "2025-10-01", to: "2025-12-31" },
  { label: "Q4 2025", from: "2025-10-01", to: "2025-12-31" },
  { label: "S2 2025", from: "2025-07-01", to: "2025-12-31" },
];

export default function DatePicker({ dateFrom, dateTo, onApply, loading }: DatePickerProps) {
  const [from, setFrom] = useState(dateFrom);
  const [to, setTo] = useState(dateTo);
  const [showPresets, setShowPresets] = useState(false);

  const handleApply = () => {
    onApply(from, to);
    setShowPresets(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-surface hover:bg-surface-hover transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-text-muted" />
          Périodes prédéfinies
        </button>
        {showPresets && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[180px]">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setFrom(p.from);
                  setTo(p.to);
                  onApply(p.from, p.to);
                  setShowPresets(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-surface-hover transition-colors ${
                  from === p.from && to === p.to
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-2 py-1.5 text-xs border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-xs text-text-muted">au</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-2 py-1.5 text-xs border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <button
        onClick={handleApply}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Chargement...
          </>
        ) : (
          "Appliquer"
        )}
      </button>
    </div>
  );
}
