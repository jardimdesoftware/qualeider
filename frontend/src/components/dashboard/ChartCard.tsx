"use client";

import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Wrapper compartilhado pelos cards de gráfico do dashboard - centraliza o
 * container/título repetido antes em cada gráfico individualmente.
 */
export default function ChartCard({
  title,
  subtitle,
  children,
}: ChartCardProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[280px]">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
