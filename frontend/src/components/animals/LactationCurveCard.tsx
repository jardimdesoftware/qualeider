"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { buildLactationCurve, CollectionRow } from "@/utils/lactation-curve";
import { daysSinceCalving, lactationLabel } from "@/utils/lactation";

interface LactationCurveCardProps {
  calvingDate?: string | null;
  lactationNumber?: number | null;
  history: CollectionRow[];
}

const CurveTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { day: number; liters: number; date: string } }[];
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const { day, liters, date } = payload[0].payload;
  return (
    <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl text-sm">
      <p className="font-bold text-slate-700 mb-1">Dia {day} de lactação</p>
      <p className="text-slate-500 text-xs mb-1">
        {date.split("-").reverse().join("/")}
      </p>
      <p className="font-semibold text-slate-800">{liters} L</p>
    </div>
  );
};

/** Produção diária da vaca ao longo dos dias desde o último parto. */
export default function LactationCurveCard({
  calvingDate,
  lactationNumber,
  history,
}: LactationCurveCardProps) {
  const curve = buildLactationCurve(calvingDate, history);
  const currentDay = daysSinceCalving(calvingDate);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
          <TrendingUp size={18} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Curva de lactação
          </h2>
          <p className="text-xs text-gray-500">
            Litros por dia, contados desde o parto
            {lactationNumber ? ` · ${lactationLabel(lactationNumber)}` : ""}
          </p>
        </div>
      </div>

      {!calvingDate && (
        <p className="mt-4 text-sm text-gray-500">
          Informe a data do último parto no cadastro da vaca para ver a curva.
        </p>
      )}

      {calvingDate && curve.points.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">
          Ainda não há coletas desta vaca depois do parto.
        </p>
      )}

      {calvingDate && curve.points.length > 0 && curve.peak && (
        <>
          <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="text-xs uppercase font-bold text-slate-500">
                Pico
              </p>
              <p className="text-lg font-bold text-slate-800">
                {curve.peak.liters} L
              </p>
              <p className="text-xs text-slate-500">no dia {curve.peak.day}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="text-xs uppercase font-bold text-slate-500">
                Dias em lactação
              </p>
              <p className="text-lg font-bold text-slate-800">
                {currentDay ?? "—"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="text-xs uppercase font-bold text-slate-500">
                Dias com coleta
              </p>
              <p className="text-lg font-bold text-slate-800">
                {curve.points.length}
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={curve.points}
                margin={{ top: 10, right: 16, left: -8, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="day"
                  type="number"
                  domain={[0, "dataMax"]}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickMargin={10}
                  label={{
                    value: "Dias desde o parto",
                    position: "insideBottom",
                    offset: -14,
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  unit=" L"
                />
                <Tooltip content={<CurveTooltip />} />
                <Line
                  type="monotone"
                  dataKey="liters"
                  stroke="#2f9e41"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 0, fill: "#2f9e41" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#2f9e41" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
