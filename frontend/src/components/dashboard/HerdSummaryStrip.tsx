"use client";

interface SummaryItem {
  label: string;
  value: string | number;
  /** Métrica principal: ganha destaque (número grande) na frente da faixa. */
  primary?: boolean;
}

interface HerdSummaryStripProps {
  items: SummaryItem[];
}

/**
 * Faixa fina de números agregados no topo do painel — substitui a antiga
 * grade de 6 cartões repetidos (ícone + título + número), que lia como
 * template genérico. Ver DESIGN.md.
 */
export default function HerdSummaryStrip({ items }: HerdSummaryStripProps) {
  const primary = items.find((i) => i.primary);
  const secondary = items.filter((i) => !i.primary);

  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-4 bg-[#eef6ea] rounded-xl px-5 py-4">
      {primary && (
        <div className="flex flex-col pr-10 sm:border-r sm:border-[#cfe3c6]">
          <span className="text-4xl md:text-5xl font-black text-brand-primary tabular-nums leading-none">
            {primary.value}
          </span>
          <span className="text-sm font-semibold text-slate-700 mt-1.5">
            {primary.label}
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {secondary.map((item) => (
          <div key={item.label} className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-800 tabular-nums">
              {item.value}
            </span>
            <span className="text-xs text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
