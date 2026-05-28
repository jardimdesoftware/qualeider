"use client";

import React from "react";
import { X, Check, Droplets } from "lucide-react";
import { Animal } from "@/interfaces/animal";

interface ActiveCowFormProps {
  animal: Animal;
  animalLabel: string;
  quantity: string;
  cmtResult: string | null;
  onQuantityChange: (val: string) => void;
  onCmtChange: (val: string | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CMT_OPTIONS = [
  {
    value: "Normal",
    label: "Normal",
    bg: "bg-green-100 border-green-400 text-green-800",
    activeBg: "bg-green-500 border-green-600 text-white",
    dot: "bg-green-500",
  },
  {
    value: "Suspeito",
    label: "Suspeito",
    bg: "bg-yellow-100 border-yellow-400 text-yellow-800",
    activeBg: "bg-yellow-500 border-yellow-600 text-white",
    dot: "bg-yellow-500",
  },
  {
    value: "Positivo",
    label: "Positivo",
    bg: "bg-red-100 border-red-400 text-red-800",
    activeBg: "bg-red-500 border-red-600 text-white",
    dot: "bg-red-500",
  },
] as const;

export function ActiveCowForm({
  animal,
  animalLabel,
  quantity,
  cmtResult,
  onQuantityChange,
  onCmtChange,
  onConfirm,
  onCancel,
}: ActiveCowFormProps) {
  const qty = parseFloat(quantity.replace(",", "."));
  const isValid = !isNaN(qty) && qty > 0;

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(",", ".");
    if (/^\d*\.?\d*$/.test(val)) {
      onQuantityChange(val);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-[#d97706] shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-amber-50 px-4 py-3 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-[#d97706]" />
          <span className="font-black text-[#1e3a29] text-lg">{animalLabel}</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Cancelar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Liters input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Litros produzidos
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={quantity}
              onChange={handleQuantityInput}
              autoFocus
              className="w-full text-center text-4xl font-black text-[#1e3a29] border-2 rounded-xl py-4 focus:outline-none focus:border-[#d97706] transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl pointer-events-none">
              L
            </span>
          </div>
        </div>

        {/* CMT test */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Teste da Caneca (CMT)
            <span className="text-slate-400 font-normal ml-1">— opcional</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CMT_OPTIONS.map((opt) => {
              const isActive = cmtResult === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onCmtChange(isActive ? null : opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    isActive ? opt.activeBg : opt.bg
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${isActive ? "bg-white/80" : opt.dot}`}
                  />
                  {opt.label}
                  {isActive && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={onConfirm}
          disabled={!isValid}
          className="w-full bg-[#1e3a29] hover:bg-[#15291e] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Confirmar Vaca
        </button>
      </div>
    </div>
  );
}
