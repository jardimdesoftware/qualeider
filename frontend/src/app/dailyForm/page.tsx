"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout";
import { apiBase } from "@/services/baseApi";
import {
  InputField,
  SelectField,
  Button,
  ErrorModal,
  EmptyState,
  ContentCard,
  BrandHeader,
} from "@/components/ui";
import { CheckCircle, Calendar } from "lucide-react";
import {
  MilkingPlace,
  DailyCollectionCreate,
} from "@/interfaces/daily-collection";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function DailyForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<DailyCollectionCreate>({
    quantity: 0,
    userId: 0,
    numAnimals: 0,
    numOrdens: 0,
    rationProvided: false,
    numLactation: 0,
    milkingPlace: MilkingPlace.Aberto,
    technicalAssistance: false,
    collectionDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

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
        setFormData((prev) => ({ ...prev, userId: uid }));
        checkIfUserAlreadySubmitted(uid);
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  const checkIfUserAlreadySubmitted = async (userId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await apiBase.get(
        `/daily-collections/check?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.alreadySubmitted) {
        setAlreadySubmitted(true);
      }
    } catch (err) {
      console.error("Erro ao verificar submissão:", err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.quantity < 0) {
      newErrors.quantity = "Quantidade deve ser preenchida";
    }
    if (formData.numAnimals < 0) {
      newErrors.numAnimals = "Número de animais deve ser preenchido";
    }
    if (formData.numOrdens < 0) {
      newErrors.numOrdens = "Número de ordenhas deve ser preenchido";
    }
    if (formData.numLactation < 0) {
      newErrors.numLactation = "Número de lactações deve ser preenchido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await apiBase.post("/daily-collections", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setModalType("success");
        setModalMessage("Formulário enviado com sucesso!");
        setShowModal(true);
        setAlreadySubmitted(true);
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

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <EmptyState
              icon={<CheckCircle size={48} className="text-green-500" />}
              title="Formulário já enviado hoje"
              description="Você já registrou a coleta de hoje. Volte amanhã para registrar uma nova coleta!"
              actionHref="/dashboardUser"
              actionLabel="Voltar ao Dashboard"
            />
          </div>
        </div>
      </div>
    );
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
            <p className="text-slate-500">
              Registro de Coleta de Leite
            </p>
          </div>
          <div className="flex items-center gap-4 bg-[#fdfbf7] px-4 py-2 rounded-lg border border-slate-200">
            <div className="text-right hidden md:block">
              <p className="text-xs text-slate-400 font-bold uppercase">Data</p>
              <p className="text-[#1e3a29] font-bold">{currentDate}</p>
            </div>
            <Calendar className="w-8 h-8 text-[#d97706]" />
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quantidade de Leite */}
              <InputField
                label="Total de leite em litros"
                type="number"
                value={formData.quantity.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value, 10) || 0,
                  })
                }
                error={errors.quantity}
                required
                min="0"
              />

              {/* Número de Animais */}
              <InputField
                label="Número de Animais"
                type="number"
                value={formData.numAnimals.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numAnimals: parseInt(e.target.value, 10) || 0,
                  })
                }
                error={errors.numAnimals}
                required
                min="0"
              />

              {/* Número de Ordenhas */}
              <InputField
                label="Número de Ordenhas"
                type="number"
                value={formData.numOrdens.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numOrdens: parseInt(e.target.value, 10) || 0,
                  })
                }
                error={errors.numOrdens}
                required
                min="0"
              />

              {/* Número de Lactações */}
              <InputField
                label="Número de Lactações"
                type="number"
                value={formData.numLactation.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numLactation: parseInt(e.target.value, 10) || 0,
                  })
                }
                error={errors.numLactation}
                required
                min="0"
              />

              {/* Ração Fornecida */}
              <SelectField
                label="Ração Fornecida"
                value={formData.rationProvided ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rationProvided: e.target.value === "true",
                  })
                }
                options={[
                  { value: "true", label: "Sim" },
                  { value: "false", label: "Não" },
                ]}
                required
              />

              {/* Local de Ordenha */}
              <SelectField
                label="Local de Ordenha"
                value={formData.milkingPlace}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    milkingPlace: e.target.value as MilkingPlace,
                  })
                }
                options={[
                  { value: MilkingPlace.Aberto, label: "Aberto" },
                  { value: MilkingPlace.Curral, label: "Curral" },
                  { value: MilkingPlace.Ambos, label: "Ambos" },
                ]}
                required
              />

              {/* Assistência Técnica */}
              <SelectField
                label="Assistência Técnica"
                value={formData.technicalAssistance ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    technicalAssistance: e.target.value === "true",
                  })
                }
                options={[
                  { value: "true", label: "Sim" },
                  { value: "false", label: "Não" },
                ]}
                required
              />

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" variant="primary" fullWidth>
                  Enviar Formulário
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => router.push("/dashboardUser")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso/Erro */}
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
