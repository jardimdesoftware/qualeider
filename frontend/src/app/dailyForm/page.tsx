"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import { Sidebar } from "@/components/layout";
import { InputField, SelectField, Button, ErrorModal } from "@/components/ui";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { MilkingPlace } from "@/interfaces/daily-collection";
import { dailyCollectionSchema, DailyCollectionData } from "@/schemas/collection";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { collectionService } from "@/services/collectionService";
import { getLocalDate, formatDateLongBR } from "@/utils/date";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

export default function DailyForm() {
  const router = useRouter();

  const { userId, isLoading } = useAuthGuard("user");

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "info",
    message: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DailyCollectionData>({
    resolver: zodResolver(dailyCollectionSchema),
    mode: "onBlur",
    defaultValues: {
      quantity: 0,
      numAnimals: 0,
      numOrdens: 0,
      rationProvided: false,
      numLactation: 0,
      milkingPlace: MilkingPlace.Aberto,
      technicalAssistance: false,
      collectionDate: getLocalDate(), 
    },
  });

  const onSubmit = async (data: DailyCollectionData) => {
    if (!userId) return;

    try {
      await collectionService.create(data, userId);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Coleta registrada com sucesso!",
      });
    } catch (err) {
      console.error(err);
      setModalState({
        isOpen: true,
        type: "error",
        message: getFriendlyErrorMessage(err),
      });
    }
  };

  const displayDate = formatDateLongBR(new Date());

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
              Formulário Diário
            </h2>
            <p className="text-slate-500">Registro de Coleta de Leite</p>
          </div>
          <div className="flex items-center gap-4 bg-[#fdfbf7] px-4 py-2 rounded-lg border border-slate-200">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-bold uppercase">Data</p>
              <p className="text-[#1e3a29] font-bold">{displayDate}</p>
            </div>
            <Calendar className="w-8 h-8 text-[#d97706]" />
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Quantidade de Leite (litros)"
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                  error={errors.quantity?.message}
                  {...register("quantity", { valueAsNumber: true })}
                />

                <InputField
                  label="Número de Animais"
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  error={errors.numAnimals?.message}
                  {...register("numAnimals", { valueAsNumber: true })}
                />

                <InputField
                  label="Número de Ordenhas"
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  error={errors.numOrdens?.message}
                  {...register("numOrdens", { valueAsNumber: true })}
                />

                <InputField
                  label="Número de Lactações"
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

              <div className="space-y-4">
                <CheckboxRow
                  id="rationProvided"
                  label="Ração foi fornecida?"
                  register={register}
                  disabled={isSubmitting}
                />

                <CheckboxRow
                  id="technicalAssistance"
                  label="Recebeu assistência técnica?"
                  register={register}
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "ENVIANDO..." : "ENVIAR FORMULÁRIO"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          if (modalState.type === "success") {
            router.push("/dashboardUser");
          }
        }}
        title={modalState.type === "success" ? "Sucesso!" : "Atenção"}
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
}

// Helper component for checkbox rows
interface CheckboxRowProps {
  id: string;
  label: string;
  register: any;
  disabled: boolean;
}

const CheckboxRow = ({ id, label, register, disabled }: CheckboxRowProps) => (
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      id={id}
      disabled={disabled}
      {...register(id)}
      className="w-5 h-5 text-[#1e3a29] border-gray-300 rounded focus:ring-[#1e3a29]"
    />
    <label
      htmlFor={id}
      className="text-sm font-medium text-gray-700 cursor-pointer"
    >
      {label}
    </label>
  </div>
);
