"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { BREED_OPTIONS } from "@/constants/animal-breeds";
import { AnimalType } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { animalSchema, AnimalData } from "@/schemas/animal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { animalService } from "@/services/animalService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

export default function AddAnimal() {
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
    if (!userId || typeof userId !== 'number') {
      setModalState({
        isOpen: true,
        type: "error",
        message: "Erro de autenticação. Por favor, faça login novamente.",
      });
      return;
    }
    
    try {
      await animalService.create(data, userId);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Animal cadastrado com sucesso!",
      });
    } catch (err: any) {
      console.error("Erro ao cadastrar animal:", err);
      setModalState({
        isOpen: true,
        type: "error",
        message: getFriendlyErrorMessage(err),
      });
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
    <>
      <DashboardLayout>
        <PageHeader
          title="Adicionar Animal"
          subtitle="Cadastre um novo animal no rebanho"
        />

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
      </DashboardLayout>

      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          if (modalState.type === "success") {
            router.push("/manageMyAnimals");
          }
        }}
        title={modalState.type === "success" ? "Sucesso!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />
    </>
  );
}
