import React, { useEffect } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { DailyCollectionData } from "@/schemas/collection";
import { MilkingPlace } from "@/interfaces/daily-collection";
import { InputField, SelectField, Button } from "@/components/ui";

interface CollectionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  totals: {
    totalMilk: number;
    milkedCows: number;
  };
  register: UseFormRegister<DailyCollectionData>;
  errors: FieldErrors<DailyCollectionData>;
  isSubmitting: boolean;
}

export function CollectionSummaryModal({
  isOpen,
  onClose,
  onSubmit,
  totals,
  register,
  errors,
  isSubmitting,
}: CollectionSummaryModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden zoom-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-summary-modal-title"
      >
        <div className="shrink-0 px-6 pt-6">
          <h2
            id="collection-summary-modal-title"
            className="text-2xl font-bold text-slate-800 font-serif mb-4"
          >
            Resumo da Coleta
          </h2>

          <div className="flex gap-4 bg-slate-50 p-4 rounded-lg">
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 uppercase">Total Leite</p>
              <p className="text-xl font-black text-slate-800">
                {totals.totalMilk} L
              </p>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 uppercase">Animais</p>
              <p className="text-xl font-black text-slate-800">
                {totals.milkedCows}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Nº Ordenhas"
                type="number"
                min="0"
                disabled={isSubmitting}
                error={errors.numOrdens?.message}
                {...register("numOrdens", { valueAsNumber: true })}
              />
              <InputField
                label="Lactações"
                type="number"
                min="0"
                disabled={isSubmitting}
                error={errors.numLactation?.message}
                {...register("numLactation", { valueAsNumber: true })}
              />
            </div>

            <SelectField
              label="Local de Ordenha"
              disabled={isSubmitting}
              error={errors.milkingPlace?.message}
              {...register("milkingPlace")}
              options={[
                { value: MilkingPlace.Aberto, label: "Aberto" },
                { value: MilkingPlace.Curral, label: "Curral" },
                { value: MilkingPlace.Ambos, label: "Ambos" },
              ]}
            />

            <div className="py-2 space-y-3">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  {...register("rationProvided")}
                  className="w-5 h-5 text-slate-800 rounded focus:ring-[#2f9e41]"
                />
                <span className="font-medium text-slate-700">
                  Ração fornecida?
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  {...register("technicalAssistance")}
                  className="w-5 h-5 text-slate-800 rounded focus:ring-[#2f9e41]"
                />
                <span className="font-medium text-slate-700">
                  Assistência técnica?
                </span>
              </label>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isSubmitting}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? "ENVIANDO..." : "CONFIRMAR"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
