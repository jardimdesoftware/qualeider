"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Sidebar } from "@/components/layout";
import { apiBase } from "@/services/baseApi";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { BREED_OPTIONS } from "@/constants/animal-breeds";
import { Animal, AnimalType } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { animalSchema, AnimalData } from "@/schemas/animal";

function EditAnimalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animalId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnimalData>({
    resolver: zodResolver(animalSchema),
    mode: "onBlur",
  });

  const selectedAnimalType = watch("animalType");

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
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao decodificar o token:", err);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!animalId) return;

    const fetchAnimal = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await apiBase.get<Animal>(`/animals/${animalId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const animal = response.data;
        reset({
          name: animal.name,
          animalType: animal.animalType as AnimalType,
          breed: animal.breed,
          age: animal.age,
        });
      } catch (err) {
        console.error("Erro ao buscar animal:", err);
        setModalType("error");
        setModalMessage("Erro ao carregar dados do animal.");
        setShowModal(true);
      }
    };

    fetchAnimal();
  }, [animalId, reset]);

  const onSubmit = async (data: AnimalData) => {
    try {
      const token = localStorage.getItem("authToken");
      await apiBase.put(`/animals/${animalId}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setModalType("success");
      setModalMessage("Animal atualizado com sucesso!");
      setShowModal(true);
    } catch (err: any) {
      console.error("Erro ao atualizar animal:", err);
      setModalType("error");
      setModalMessage("Erro ao atualizar animal. Tente novamente.");
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === "success") {
      router.push("/manageMyAnimals");
    }
  };

  const breedOptions = selectedAnimalType
    ? BREED_OPTIONS[selectedAnimalType as unknown as keyof typeof BREED_OPTIONS].map(
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
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            Editar Animal
          </h2>
          <p className="text-slate-500">Atualize as informações do animal</p>
        </header>

        <div className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <InputField
                label="Nome do Animal"
                type="text"
                disabled={isSubmitting}
                error={errors.name?.message}
                {...register("name")}
              />

              <SelectField
                label="Tipo de Animal"
                disabled={isSubmitting}
                error={errors.animalType?.message}
                {...register("animalType")}
                onChange={(e) => {
                  setValue("animalType", e.target.value as AnimalType);
                  setValue("breed", "");
                }}
                options={[
                  { value: AnimalType.Vaca, label: "Vaca" },
                  { value: AnimalType.Cabra, label: "Cabra" },
                  { value: AnimalType.Ovelha, label: "Ovelha" },
                  { value: AnimalType.Bufala, label: "Búfala" },
                  { value: AnimalType.Outro, label: "Outro" },
                ]}
              />

              <SelectField
                label="Raça"
                disabled={isSubmitting || !selectedAnimalType}
                error={errors.breed?.message}
                {...register("breed")}
                options={breedOptions}
              />

              <InputField
                label="Idade (em anos)"
                type="number"
                disabled={isSubmitting}
                error={errors.age?.message}
                {...register("age", { valueAsNumber: true })}
                min="1"
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
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

export default function EditAnimal() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <EditAnimalContent />
    </Suspense>
  );
}
