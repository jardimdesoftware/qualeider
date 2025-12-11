"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout";
import { apiBase } from "@/services/baseApi";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { BREED_OPTIONS } from "@/constants/animal-breeds";
import { CreateAnimalDto, AnimalType } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";

export default function AddAnimal() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateAnimalDto>({
    name: "",
    animalType: AnimalType.Vaca,
    breed: "",
    age: 1,
    userId: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Nome é obrigatório";
    if (!formData.animalType)
      newErrors.animalType = "Tipo de animal é obrigatório";
    if (!formData.breed) newErrors.breed = "Raça é obrigatória";
    if (formData.age < 1)
      newErrors.age = "Idade deve ser 1 ou mais";

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
      const response = await apiBase.post("/animals", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setModalType("success");
        setModalMessage("Animal cadastrado com sucesso!");
        setShowModal(true);
      } else {
        setModalType("error");
        setModalMessage("Erro ao cadastrar animal");
        setShowModal(true);
      }
    } catch (err) {
      console.error("Erro ao cadastrar animal:", err);
      setModalType("error");
      setModalMessage("Erro ao cadastrar animal. Tente novamente.");
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === "success") {
      router.push("/manageMyAnimals");
    }
  };

  const breedOptions = formData.animalType
    ? BREED_OPTIONS[formData.animalType as unknown as keyof typeof BREED_OPTIONS].map(
        (breed) => ({ value: breed, label: breed })
      )
    : [];

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            Adicionar Animal
          </h2>
          <p className="text-slate-500">Cadastre um novo animal no rebanho</p>
        </header>

        <div className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <InputField
                label="Nome do Animal"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
                required
              />

              <SelectField
                label="Tipo de Animal"
                value={formData.animalType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    animalType: e.target.value as AnimalType,
                    breed: "",
                  })
                }
                options={[
                  { value: AnimalType.Vaca, label: "Vaca" },
                  { value: AnimalType.Cabra, label: "Cabra" },
                  { value: AnimalType.Ovelha, label: "Ovelha" },
                  { value: AnimalType.Bufala, label: "Búfala" },
                  { value: AnimalType.Outro, label: "Outro" },
                ]}
                error={errors.animalType}
                required
              />

              <SelectField
                label="Raça"
                value={formData.breed}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
                options={breedOptions}
                error={errors.breed}
                required
                disabled={!formData.animalType}
              />

              <InputField
                label="Idade (em anos)"
                type="number"
                value={formData.age.toString()}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (value >= 1) {
                    setFormData({ ...formData, age: value });
                  }
                }}
                error={errors.age}
                required
                min="1"
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" variant="primary" fullWidth>
                  Cadastrar Animal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => router.push("/manageMyAnimals")}
                >
                  Cancelar
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
