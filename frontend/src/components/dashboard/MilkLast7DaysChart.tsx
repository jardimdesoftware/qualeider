"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import EmptyState from "@/components/empty-state";
import { Milk } from "lucide-react";

interface LineChartData {
  date: string;
  quantity: number;
}

interface MilkLast7DaysChartProps {
  data: LineChartData[];
}

export default function MilkLast7DaysChart({ data }: MilkLast7DaysChartProps) {
  const hasCollections = data.length > 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 flex flex-col items-center min-h-[350px]">
      <h2 className="text-lg font-semibold mb-4">
        Leite Coletado (Últimos 7 Dias)
      </h2>
      {hasCollections ? (
        <div className="w-full h-[300px] flex justify-center items-center">
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend
              align="center"
              wrapperStyle={{
                paddingTop: 10,
                textAlign: "center",
              }}
            />
            <Line
              type="monotone"
              dataKey="quantity"
              name="Leite (litros)"
              stroke="#9467BD"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </div>
      ) : (
        <div className="w-full mt-4">
          <EmptyState
            icon={<Milk size={32} />}
            title="Sem dados de coletas"
            description="Registre coletas diárias para visualizar o gráfico."
            actionHref="/dailyForm"
            actionLabel="Registrar coleta"
          />
        </div>
      )}
    </div>
  );
}
