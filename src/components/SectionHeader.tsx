import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
}

export default function SectionHeader({ title, subtitle, icon: Icon, color }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
