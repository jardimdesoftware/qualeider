"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Milk } from "lucide-react";
import { DailyCollection, MilkingPlace } from "@/interfaces/daily-collection";
import { ICON_SIZES } from "@/constants/ui";

const editCollectionSchema = z.object({
  collectionDate: z.string().min(1, "Data é obrigatória"),
  quantity: z.number().min(0, "Deve ser ≥ 0"),
  numAnimals: z.number().min(0, "Deve ser ≥ 0"),
  numOrdens: z.number().min(0, "Deve ser ≥ 0"),
  numLactation: z.number().min(0, "Deve ser ≥ 0"),
  milkingPlace: z.nativeEnum(MilkingPlace),
  rationProvided: z.boolean(),
  technicalAssistance: z.boolean(),
});

type EditCollectionFormData = z.infer<typeof editCollectionSchema>;

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: DailyCollection | null;
  onSave: (id: number, data: Partial<EditCollectionFormData>) => void;
  isSaving?: boolean;
}

export function EditCollectionModal({
  isOpen,
  onClose,
  collection,
  onSave,
  isSaving = false,
}: EditCollectionModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditCollectionFormData>({
    resolver: zodResolver(editCollectionSchema),
  });

  useEffect(() => {
    if (collection) {
      reset({
        collectionDate: collection.collectionDate.slice(0, 10),
        quantity: collection.quantity,
        numAnimals: collection.numAnimals,
        numOrdens: collection.numOrdens,
        numLactation: collection.numLactation,
        milkingPlace: collection.milkingPlace,
        rationProvided: collection.rationProvided,
        technicalAssistance: collection.technicalAssistance,
      });
    }
  }, [collection, reset]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !collection) return null;

  const onSubmit = (data: EditCollectionFormData) => {
    onSave(collection.id, data);
  };

  const inputCls =
    "w-full h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-gray-100";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";
  const errorCls = "text-red-500 text-xs mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#fdfbf7]">
          <div className="flex items-center gap-2">
            <Milk className="text-[#d97706]" size={ICON_SIZES.MD} />
            <h3 className="text-lg font-bold text-[#1e3a29]">Editar Coleta</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={ICON_SIZES.SM} />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            {/* Data e Quantidade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Data da Coleta</label>
                <input
                  type="date"
                  {...register("collectionDate")}
                  disabled={isSaving}
                  className={inputCls}
                />
                {errors.collectionDate && (
                  <p className={errorCls}>{errors.collectionDate.message}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Quantidade (L)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("quantity", { valueAsNumber: true })}
                  disabled={isSaving}
                  className={inputCls}
                />
                {errors.quantity && (
                  <p className={errorCls}>{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* Animais, Ordenhas, Lactações */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Nº Animais</label>
                <input
                  type="number"
                  {...register("numAnimals", { valueAsNumber: true })}
                  disabled={isSaving}
                  className={inputCls}
                />
                {errors.numAnimals && (
                  <p className={errorCls}>{errors.numAnimals.message}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Nº Ordenhas</label>
                <input
                  type="number"
                  {...register("numOrdens", { valueAsNumber: true })}
                  disabled={isSaving}
                  className={inputCls}
                />
                {errors.numOrdens && (
                  <p className={errorCls}>{errors.numOrdens.message}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Nº Lactações</label>
                <input
                  type="number"
                  {...register("numLactation", { valueAsNumber: true })}
                  disabled={isSaving}
                  className={inputCls}
                />
                {errors.numLactation && (
                  <p className={errorCls}>{errors.numLactation.message}</p>
                )}
              </div>
            </div>

            {/* Local de Ordenha */}
            <div>
              <label className={labelCls}>Local de Ordenha</label>
              <select
                {...register("milkingPlace")}
                disabled={isSaving}
                className={inputCls}
              >
                <option value="Aberto">Aberto</option>
                <option value="Curral">Curral</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("rationProvided")}
                  disabled={isSaving}
                  className="w-4 h-4 accent-brand-primary"
                />
                Ração fornecida
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("technicalAssistance")}
                  disabled={isSaving}
                  className="w-4 h-4 accent-brand-primary"
                />
                Assistência técnica
              </label>
            </div>
          </div>

          {/* Footer */}
          <footer className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors text-sm disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
