"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { useAnimal, useUpdateAnimal } from "@/hooks/queries/useAnimals";

function EditAnimalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animalId = searchParams.get("id");
  
  const { isLoading: authLoading } = useAuthGuard("user");
  const { data: animal, isLoading: loadingAnimal } = useAnimal(animalId ? Number(animalId) : null);
  const updateAnimal = useUpdateAnimal();
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnimalData>({
    resolver: zodResolver(animalSchema),
    mode: "onBlur",
  });

  const selectedAnimalType = watch("animalType");
  useEffect(() => {
    if (animal) {
      reset({
        name: animal.name,
        animalType: animal.animalType,
        breed: animal.breed,
        age: animal.age,
      });
    }
  }, [animal, reset]);

  const onSubmit = async (data: AnimalData) => {
    if (!animalId) return;
    
    try {
      await updateAnimal.mutateAsync({ id: Number(animalId), data });

      setModalState({
        isOpen: true,
        type: "success",
        message: "Dados atualizados com sucesso!",
      });
    } catch (err: any) {
      console.error("Erro ao atualizar animal:", err);
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

  if (authLoading || loadingAnimal) {
    return <DashboardLoading />;
  }

  return (
    <>
      <DashboardLayout>
        <PageHeader
          title="Editar Animal"
          subtitle="Atualize as informações do animal"
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
      </DashboardLayout>

      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          if (modalState.type === "success") {
            router.push("/manageMyAnimals");
          }
        }}
        title={modalState.type === "success" ? "Sucesso!" : "Atenção"}
        message={modalState.message}
        type={modalState.type as any}
      />
    </>
  );
}

export default function EditAnimal() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <EditAnimalContent />
    </Suspense>
  );
}
