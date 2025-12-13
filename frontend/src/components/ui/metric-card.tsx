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
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-50",
  borderColor = "border-[#1e3a29]",
  title,
  value,
  unit,
  trend,
  trendUp,
}: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md border-b-4 ${borderColor} p-5 hover:shadow-lg transition-shadow`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-500 text-sm font-bold uppercase">
          {title}
        </span>
        <div className={`p-2 ${iconBgColor} rounded-lg ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-[#1e3a29]">{value}</span>
        {unit && (
          <span className="text-sm font-bold text-slate-400">{unit}</span>
        )}
      </div>
      {trend && (
        <p
          className={`text-xs font-bold mt-2 flex items-center gap-1 ${
            trendUp ? "text-[#4ade80]" : "text-slate-400"
          }`}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
