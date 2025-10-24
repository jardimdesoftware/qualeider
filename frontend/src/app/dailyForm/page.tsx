"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/siedbar";
import { apiBase } from "@/services/baseApi";
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "Common") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (formData.quantity < 0)
      newErrors.quantity = "Quantidade deve ser preenchida";
    if (formData.numAnimals < 0)
      newErrors.numAnimals = "Número de animais deve ser preenchido";
    if (formData.numOrdens < 0)
      newErrors.numOrdens = "Número de ordenhas deve ser preenchido";
    if (formData.numLactation < 0)
      newErrors.numLactation = "Número de lactações deve ser preenchido";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        setModalMessage("Formulário enviado com sucesso!");
        setAlreadySubmitted(true);
      } else {
        setModalMessage("Erro ao enviar formulário");
      }
    } catch (err) {
      console.error("Erro ao enviar formulário:", err);
      setModalMessage("Erro ao enviar formulário");
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    if (modalMessage === "Formulário enviado com sucesso!") {
      router.push("/dashboardCommon");
    }
  };

  if (loading) {
    return <DashboardLoading />;
  }

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
            Formulário Diário
          </h1>
          <p className="text-gray-600">
            Você já respondeu o formulário hoje. Volte amanhã para responder
            novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
          Formulário Diário
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total de leite em litros <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value, 10),
                })
              }
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm">{errors.quantity}</p>
            )}
          </div>

          {/* Número de Animais */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de Animais <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.numAnimals}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numAnimals: parseInt(e.target.value, 10),
                })
              }
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.numAnimals && (
              <p className="text-red-500 text-sm">{errors.numAnimals}</p>
            )}
          </div>

          {/* Número de Ordenhas */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de Ordenhas <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.numOrdens}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numOrdens: parseInt(e.target.value, 10),
                })
              }
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.numOrdens && (
              <p className="text-red-500 text-sm">{errors.numOrdens}</p>
            )}
          </div>

          {/* Ração Fornecida */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ração Fornecida <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.rationProvided ? "true" : "false"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rationProvided: e.target.value === "true",
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          {/* Número de Lactações */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de Lactações <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.numLactation}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numLactation: parseInt(e.target.value, 10),
                })
              }
              min="0"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.numLactation && (
              <p className="text-red-500 text-sm">{errors.numLactation}</p>
            )}
          </div>

          {/* Local de Ordenha */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Local de Ordenha <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.milkingPlace}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  milkingPlace: e.target.value as MilkingPlace,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value={MilkingPlace.Aberto}>Aberto</option>
              <option value={MilkingPlace.Curral}>Curral</option>
              <option value={MilkingPlace.Ambos}>Ambos</option>
            </select>
          </div>

          {/* Assistência Técnica */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assistência Técnica <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.technicalAssistance ? "true" : "false"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  technicalAssistance: e.target.value === "true",
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          {/* Botões de Enviar e Cancelar */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Enviar
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboardCommon")}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Modal de sucesso/erro */}
        {modalMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
              <p>{modalMessage}</p>
              <button
                onClick={closeModal}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
