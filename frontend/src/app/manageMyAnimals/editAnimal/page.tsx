"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { AnimalType } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { animalSchema, AnimalData } from "@/schemas/animal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { useAnimal, useUpdateAnimal } from "@/hooks/queries/useAnimals";
import { useBreeds } from "@/hooks/queries/useBreeds";

function EditAnimalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animalId = searchParams.get("id");

  const { isLoading: authLoading } = useAuthGuard("user");
  const { data: animal, isLoading: loadingAnimal } = useAnimal(
    animalId ? Number(animalId) : null
  );
  const { data: breeds = [], isLoading: loadingBreeds } = useBreeds();
  const updateAnimal = useUpdateAnimal();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "info",
    message: "",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnimalData>({
    resolver: zodResolver(animalSchema),
    mode: "onBlur",
  });

  // Valor atual do breedId no form — controla o <select> visualmente
  const selectedBreedId = watch("breedId");

  // Popula o formulário quando o animal é carregado
  useEffect(() => {
    if (animal) {
      reset({
        name: animal.name,
        animalType: animal.animalType,
        breedId: animal.breedId ?? undefined,
        breed: animal.breed,
        age: animal.age,
      });
    }
  }, [animal, reset]);

  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setValue("breedId", id, { shouldValidate: true });
    const found = breeds.find((b) => b.id === id);
    setValue("breed", found?.name ?? "");
  };

  const onSubmit = async (data: AnimalData) => {
    if (!animalId) return;
    try {
      await updateAnimal.mutateAsync({ id: Number(animalId), data });
      setModalState({ isOpen: true, type: "success", message: "Dados atualizados com sucesso!" });
    } catch (err: any) {
      setModalState({ isOpen: true, type: "error", message: getFriendlyErrorMessage(err) });
    }
  };

  const breedOptions = breeds.map((b) => ({ value: String(b.id), label: b.name }));

  if (authLoading || loadingAnimal) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader title="Editar Animal" subtitle="Atualize as informações do animal" />

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
                options={[
                  { value: AnimalType.Vaca, label: "Vaca" },
                  { value: AnimalType.Cabra, label: "Cabra" },
                  { value: AnimalType.Ovelha, label: "Ovelha" },
                  { value: AnimalType.Bufala, label: "Búfala" },
                  { value: AnimalType.Outro, label: "Outro" },
                ]}
                {...register("animalType")}
              />

              {/*
               * Raça alimentada 100% pelo banco via useBreeds.
               * reset() popula breedId → watch("breedId") → value={String(selectedBreedId)}
               * pré-seleciona visualmente a raça do animal sem precisar de prop value manual.
               * onChange converte para number antes do setValue.
               */}
              <SelectField
                label="Raça"
                placeholder={
                  loadingBreeds
                    ? "Carregando raças..."
                    : breedOptions.length === 0
                    ? "Nenhuma raça cadastrada — vá em Raças para adicionar"
                    : "Selecione uma raça"
                }
                disabled={isSubmitting || loadingBreeds || breedOptions.length === 0}
                error={errors.breedId?.message}
                options={breedOptions}
                value={selectedBreedId ? String(selectedBreedId) : ""}
                onChange={handleBreedChange}
              />

              <InputField
                label="Idade (em anos)"
                type="number"
                disabled={isSubmitting}
                error={errors.age?.message}
                min="0"
                max="30"
                {...register("age", { valueAsNumber: true })}
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
                  SALVAR ALTERAÇÕES
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
          setModalState((prev) => ({ ...prev, isOpen: false }));
          if (modalState.type === "success") router.push("/manageMyAnimals");
        }}
        title={modalState.type === "success" ? "Sucesso!" : "Atenção"}
        message={modalState.message}
        type={modalState.type}
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
