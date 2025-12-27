"use client";

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { EmptyState } from "@/components/ui";
import { Cat } from "lucide-react";

interface PieChartData {
  name: string;
  value: number;
}

interface AnimalDistributionChartProps {
  data: PieChartData[];
}

const CHART_COLORS = ["#4E79A7", "#E15759", "#76B7B2", "#59A14F", "#F28E2B"];

const CHART_DIMENSIONS = {
  WIDTH: 345,
  HEIGHT: 300,
  OUTER_RADIUS: 90,
} as const;

const ICON_SIZE = 32;

export default function AnimalDistributionChart({
  data,
}: AnimalDistributionChartProps) {
  const hasAnimals = data.length > 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center min-h-[350px]">
      <h2 className="text-lg font-semibold mb-4">
        Distribuição por Tipo de Animal
      </h2>
      {hasAnimals ? (
        <div className="w-full flex justify-center">
          <PieChart width={CHART_DIMENSIONS.WIDTH} height={CHART_DIMENSIONS.HEIGHT}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={CHART_DIMENSIONS.OUTER_RADIUS}
              fill="#8884d8"
              dataKey="value"
              label={({ percent }) => `(${(percent * 100).toFixed(0)}%)`}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      ) : (
        <div className="w-full mt-4">
          <EmptyState
            icon={<Cat size={ICON_SIZE} />}
            title="Sem dados de animais"
            description="Cadastre animais para ver a distribuição por tipo."
            actionHref="/manageAnimals/create"
            actionLabel="Cadastrar animal"
          />
        </div>
      )}
    </div>
  );
}
