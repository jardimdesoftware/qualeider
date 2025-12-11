import { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  iconColor?: string;
}

export default function MetricCard({
  icon,
  title,
  value,
  unit,
  iconColor = "text-green-500",
}: MetricCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex items-center">
      <div className={`${iconColor} mr-2`}>{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">
          {value}
          {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
