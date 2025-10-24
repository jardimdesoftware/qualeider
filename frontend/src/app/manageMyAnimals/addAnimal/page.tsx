"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/siedbar";
import { apiBase } from "@/services/baseApi";
import { BREED_OPTIONS } from "@/constants/animal-breeds";
import { CreateAnimal } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function AddAnimal() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateAnimal>({
    name: "",
    animalType: "",
    breed: "",
    age: 1,
    userId: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
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
        // payload.sub from JWT is typically a string; ensure numeric userId
        const userId =
          typeof payload.sub === "string"
            ? parseInt(payload.sub, 10)
            : payload.sub;
        setFormData((prev) => ({ ...prev, userId }));
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Nome é obrigatório";
    if (!formData.animalType)
      newErrors.animalType = "Tipo de animal é obrigatório";
    if (!formData.breed) newErrors.breed = "Raça é obrigatória";
    if (formData.age < 1)
      newErrors.age = "Idade deve ser um número inteiro positivo (1 ou mais)";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await apiBase.post("/animals", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setModalMessage("Animal cadastrado com sucesso!");
      } else {
        setModalMessage("Erro ao cadastrar animal");
      }
    } catch (err) {
      console.error("Erro ao cadastrar animal:", err);
      setModalMessage("Erro ao cadastrar animal");
    }
  };

  const closeModal = () => {
    setModalMessage(null);
    if (modalMessage === "Animal cadastrado com sucesso!") {
      router.push("/manageMyAnimals");
    }
  };

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6 mt-12 md:mt-4">
          Adicionar Animal
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Animal */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Tipo de Animal */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Animal <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.animalType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  animalType: e.target.value,
                  breed: "",
                })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selecione um tipo</option>
              <option value="Vaca">Vaca</option>
              <option value="Cabra">Cabra</option>
              <option value="Ovelha">Ovelha</option>
              <option value="Bufala">Bufala</option>
              <option value="Outro">Outro</option>
            </select>
            {errors.animalType && (
              <p className="text-red-500 text-sm">{errors.animalType}</p>
            )}
          </div>

          {/* Raça do Animal */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Raça <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.breed}
              onChange={(e) =>
                setFormData({ ...formData, breed: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg"
              disabled={!formData.animalType}
            >
              <option value="">Selecione uma raça</option>
              {formData.animalType &&
                BREED_OPTIONS[
                  formData.animalType as keyof typeof BREED_OPTIONS
                ].map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
            </select>
            {errors.breed && (
              <p className="text-red-500 text-sm">{errors.breed}</p>
            )}
          </div>

          {/* Idade do Animal */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Idade (em anos) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (value >= 1) {
                  setFormData({ ...formData, age: value });
                }
              }}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
          </div>

          {/* Botões de Cadastrar e Cancelar */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Cadastrar
            </button>
            <button
              type="button"
              onClick={() => router.push("/manageMyAnimals")}
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
