"use client";

import { ReactNode, useState, useEffect } from "react";
import { Calendar } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  showDate = true,
  actions,
}: PageHeaderProps) {
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    // Only compute date on client side to prevent hydration mismatch
    setCurrentDate(
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-slate-500">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {actions}
          
          {showDate && (
            <div className="flex items-center gap-4 bg-[#fdfbf7] px-4 py-2 rounded-lg border border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-400 font-bold uppercase">Data de Hoje</p>
                <p className="text-[#1e3a29] font-bold" suppressHydrationWarning>
                  {currentDate || "Carregando..."}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#d97706]" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
