"use client";

import { ReactNode, useEffect, useState } from "react";
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
    // Calculated on the client to avoid timezone hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    );
  }, []);

  return (
    <header className="border-b border-brand-border bg-white/95 px-4 py-5 shadow-[0_1px_2px_rgba(12,50,111,0.04)] md:px-8 md:py-6">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="campus-section-label mb-1">QuaLeiDer</p>
          <h2 className="text-2xl font-extrabold tracking-normal text-gray-950 md:text-3xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actions}

          {showDate && (
            <div className="flex items-center gap-3 rounded-md border border-brand-border bg-gray-50 px-3 py-2">
              <div className="hidden text-right md:block">
                <p className="text-[10px] font-bold uppercase text-brand-muted">
                  Data de hoje
                </p>
                <p
                  className="text-sm font-bold text-gray-950"
                  suppressHydrationWarning
                >
                  {currentDate || "Carregando..."}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-brand-primary" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
