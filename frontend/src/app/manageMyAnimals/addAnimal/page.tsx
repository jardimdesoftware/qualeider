"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sidebar } from "@/components/layout";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { BREED_OPTIONS } from "@/constants/animal-breeds";
import { AnimalType } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { animalSchema, AnimalData } from "@/schemas/animal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { animalService } from "@/services/animalService";

export default function AddAnimal() {
  const router = useRouter();
  const { userId, isLoading } = useAuthGuard("user");
  
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AnimalData>({
    resolver: zodResolver(animalSchema),
    mode: "onBlur",
    defaultValues: {
      animalType: AnimalType.Vaca,
      age: 1,
    },
  });

  const selectedAnimalType = watch("animalType");

  const onSubmit = async (data: AnimalData) => {
    if (!userId) return;
    
    try {
      await animalService.create(data, userId);

      setModalType("success");
      setModalMessage("Animal cadastrado com sucesso!");
      setShowModal(true);
    } catch (err: any) {
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

  const breedOptions = selectedAnimalType
    ? BREED_OPTIONS[selectedAnimalType as unknown as keyof typeof BREED_OPTIONS].map(
        (breed) => ({ value: breed, label: breed })
      )
    : [];

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            Adicionar Animal
          </h2>
          <p className="text-slate-500">Cadastre um novo animal no rebanho</p>
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
                  {isSubmitting ? "CADASTRANDO..." : "CADASTRAR ANIMAL"}
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
