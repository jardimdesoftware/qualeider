import React, { useState } from "react";
import { Animal, Status } from "@/interfaces/animal";
import { Check, Ban, Milk } from "lucide-react";

interface AnimalCollectionCardProps {
  animal: Animal;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function AnimalCollectionCard({
  animal,
  value,
  onChange,
  disabled,
}: AnimalCollectionCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isLactating = animal.status === Status.Active;
  const hasValue = value && parseFloat(value) > 0;
  const showSavedView = hasValue && !isFocused;

  if (!isLactating) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 relative opacity-60 grayscale flex items-center p-4 gap-4">
        <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
          <Ban className="w-6 h-6 text-slate-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-600 font-serif">
            {animal.name}
          </h3>
          <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1">
            SECA / INATIVA
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400">---</p>
        </div>
      </div>
    );
  }

  if (showSavedView) {
    return (
      <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 overflow-hidden relative opacity-100 transition-all">
        <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">
          SALVO
        </div>
        <div className="p-4 flex gap-4 items-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-green-200 flex-shrink-0">
            <Check className="w-6 h-6 text-green-600" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#1e3a29] font-serif">
              {animal.name}
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              {animal.breed || "Sem raça"}
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <p className="text-2xl font-black text-[#1e3a29]">
              {value} <span className="text-sm text-slate-500 font-normal">L</span>
            </p>
            <button
              onClick={() => {
                setIsFocused(true); 
              }}
              className="text-xs text-[#d97706] font-bold underline mt-1"
              disabled={disabled}
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative transition-all ${isFocused ? 'ring-2 ring-[#d97706]' : ''}`}>
      <div className="p-4 flex gap-4">
        {/* Avatar / ID */}
        <div className="flex flex-col items-center gap-1 min-w-[70px]">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${hasValue ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
             {hasValue ? <Check className="w-8 h-8 text-green-600" /> : <Milk className="w-8 h-8 text-slate-400" />}
          </div>
          <span className="text-xs font-bold text-slate-500">
            #{animal.id}
          </span>
        </div>

        {/* Input Area */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-black text-[#1e3a29] font-serif">
              {animal.name}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                className={`w-full text-center text-2xl font-bold text-[#1e3a29] border-2 rounded-lg py-2 focus:outline-none transition-all ${hasValue ? 'border-green-300 bg-green-50' : 'border-slate-200 focus:border-[#d97706] focus:bg-[#fffbeb]'}`}
                value={value}
                onChange={(e) => {
                   const val = e.target.value.replace(",", ".");
                   if (/^\d*\.?\d*$/.test(val)) {
                     onChange(val);
                   }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                autoComplete="off"
                autoFocus={isFocused}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                L
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(AnimalCollectionCard);
