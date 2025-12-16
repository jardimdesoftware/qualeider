import React from "react";

interface DailyHeaderProps {
  totalMilk: number;
  milkedCows: number;
  totalAnimals: number;
  displayDate: string;
}

export function DailyHeader({
  totalMilk,
  milkedCows,
  totalAnimals,
  displayDate,
}: DailyHeaderProps) {
  const percentage = totalAnimals > 0 ? Math.min((milkedCows / totalAnimals) * 100, 100) : 0;

  return (
    <header className="bg-[#1e3a29] text-white p-4 shadow-md sticky top-0 z-20">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="font-serif text-xl font-bold">Coleta de Leite</h1>
          <p className="text-xs text-[#4ade80] uppercase font-bold">
            {displayDate}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">
            {totalMilk.toFixed(1)}
            <span className="text-sm font-normal text-slate-300">L</span>
          </p>
          <p className="text-[10px] text-slate-300 uppercase">
            Total Parcial
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#142920] rounded-full h-2 mt-2">
        <div
          className="bg-[#d97706] h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-[10px] text-center mt-1 text-slate-400">
        {milkedCows} de {totalAnimals} animais coletados
      </p>
    </header>
  );
}
