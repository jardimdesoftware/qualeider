"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sidebar } from "@/components/layout";
import { apiBase } from "@/services/baseApi";
import {
  InputField,
  SelectField,
  Button,
  ErrorModal,
} from "@/components/ui";
import { Calendar } from "lucide-react";
import { MilkingPlace } from "@/interfaces/daily-collection";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { dailyCollectionSchema, DailyCollectionData } from "@/schemas/collection";

export default function DailyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [userId, setUserId] = useState<number>(0);

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
      collectionDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.userType !== "user") {
        router.push("/");
      } else {
        const uid =
          typeof payload.sub === "string"
            ? parseInt(payload.sub, 10)
            : payload.sub;
        setUserId(uid);
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  const onSubmit = async (data: DailyCollectionData) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await apiBase.post(
        "/daily-collections",
        { ...data, userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        setModalType("success");
        setModalMessage("Formulário enviado com sucesso!");
        setShowModal(true);
      } else {
        setModalType("error");
        setModalMessage("Erro ao enviar formulário");
        setShowModal(true);
      }
    } catch (err) {
      console.error("Erro ao enviar formulário:", err);
      setModalType("error");
      setModalMessage("Erro ao enviar formulário. Tente novamente.");
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === "success") {
      router.push("/dashboardUser");
    }
  };

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  if (loading) {
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
              <p className="text-[#1e3a29] font-bold">{currentDate}</p>
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
                  disabled={isSubmitting}
                  error={errors.quantity?.message}
                  {...register("quantity", { valueAsNumber: true })}
                  min="0"
                  step="0.01"
                />

                <InputField
                  label="Número de Animais"
                  type="number"
                  disabled={isSubmitting}
                  error={errors.numAnimals?.message}
                  {...register("numAnimals", { valueAsNumber: true })}
                  min="0"
                />

                <InputField
                  label="Número de Ordenhas"
                  type="number"
                  disabled={isSubmitting}
                  error={errors.numOrdens?.message}
                  {...register("numOrdens", { valueAsNumber: true })}
                  min="0"
                />

                <InputField
                  label="Número de Lactações"
                  type="number"
                  disabled={isSubmitting}
                  error={errors.numLactation?.message}
                  {...register("numLactation", { valueAsNumber: true })}
                  min="0"
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
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="rationProvided"
                    disabled={isSubmitting}
                    {...register("rationProvided")}
                    className="w-5 h-5 text-[#1e3a29] border-gray-300 rounded focus:ring-[#1e3a29]"
                  />
                  <label
                    htmlFor="rationProvided"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Ração foi fornecida?
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="technicalAssistance"
                    disabled={isSubmitting}
                    {...register("technicalAssistance")}
                    className="w-5 h-5 text-[#1e3a29] border-gray-300 rounded focus:ring-[#1e3a29]"
                  />
                  <label
                    htmlFor="technicalAssistance"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Recebeu assistência técnica?
                  </label>
                </div>
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
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalType === "success" ? "Sucesso!" : "Erro"}
        message={modalMessage}
        type={modalType}
      />
    </div>
  );
}
