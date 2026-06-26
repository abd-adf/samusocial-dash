export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-BE").format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)} %`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function formatVariation(
  current: number,
  previous: number | undefined
): { text: string; positive: boolean | null } {
  if (previous === undefined || previous === 0) {
    return { text: "— vs Y-1", positive: null };
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "";
  return {
    text: `${arrow} ${sign}${pct.toFixed(0)} % vs Y-1`,
    positive: pct >= 0,
  };
}

export function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  return `${months[parseInt(m, 10) - 1]} ${year}`;
}
