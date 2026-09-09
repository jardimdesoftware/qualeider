import { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  borderColor?: string;
  title: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendUp?: boolean;
}

export default function MetricCard({
  icon,
  iconColor = "text-gov-blue",
  iconBgColor = "bg-blue-50",
  borderColor = "border-brand-primary",
  title,
  value,
  unit,
  trend,
  trendUp,
}: MetricCardProps) {
  return (
    <div
      className={`group rounded-lg border border-brand-border border-l-4 ${borderColor} bg-white p-5 shadow-[0_8px_20px_rgba(12,50,111,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(12,50,111,0.08)]`}
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wide text-brand-muted">
          {title}
        </span>
        <div className={`rounded-md p-2 ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-gray-950">{value}</span>
        {unit && (
          <span className="text-sm font-semibold text-brand-muted">{unit}</span>
        )}
      </div>
      {trend && (
        <p
          className={`mt-2 flex items-center gap-1 text-xs font-bold ${
            trendUp ? "text-brand-primary" : "text-brand-muted"
          }`}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
