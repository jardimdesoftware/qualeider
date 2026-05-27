"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { Button, InputField, SelectField, ErrorModal } from "@/components/ui";
import { AnimalType } from "@/interfaces/animal";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { animalSchema, AnimalData } from "@/schemas/animal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { animalService } from "@/services/animalService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { useBreeds } from "@/hooks/queries/useBreeds";

export default function AddAnimal() {
  const router = useRouter();
  const { userId, isLoading } = useAuthGuard("user");
  const { data: breeds = [], isLoading: loadingBreeds } = useBreeds();

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
    formState: { errors, isSubmitting },
  } = useForm<AnimalData>({
    resolver: zodResolver(animalSchema),
    mode: "onBlur",
    defaultValues: {
      animalType: AnimalType.Vaca,
      age: 1,
    },
  });

  // Valor atual do breedId no form — controla o <select> visualmente
  const selectedBreedId = watch("breedId");

  // Pré-seleciona a primeira raça da lista assim que as raças carregam
  useEffect(() => {
    if (breeds.length > 0 && !selectedBreedId) {
      const first = breeds[0];
      setValue("breedId", first.id, { shouldValidate: false });
      setValue("breed", first.name);
    }
  }, [breeds, selectedBreedId, setValue]);

  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    // setValue com number explícito — evita o conflito de tipo string/number do z.coerce
    setValue("breedId", id, { shouldValidate: true });
    const found = breeds.find((b) => b.id === id);
    setValue("breed", found?.name ?? "");
  };

  const onSubmit = async (data: AnimalData) => {
    if (!userId || typeof userId !== "number") {
      setModalState({
        isOpen: true,
        type: "error",
        message: "Erro de autenticação. Por favor, faça login novamente.",
      });
      return;
    }
    try {
      await animalService.create(data, userId);
      setModalState({ isOpen: true, type: "success", message: "Animal cadastrado com sucesso!" });
    } catch (err: any) {
      setModalState({ isOpen: true, type: "error", message: getFriendlyErrorMessage(err) });
    }
  };

  const breedOptions = breeds.map((b) => ({ value: String(b.id), label: b.name }));

  if (isLoading) return <DashboardLoading />;

  return (
    <>
      <DashboardLayout>
        <PageHeader title="Adicionar Animal" subtitle="Cadastre um novo animal no rebanho" />

        <div className="p-6 md:p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <InputField
                label="Nome do Animal"
                type="text"
                placeholder="Ex: Mimosa, Estrela..."
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
               * Controlado por watch("breedId") → value={String(selectedBreedId)}.
               * onChange converte para number antes de chamar setValue,
               * evitando o erro de tipo Resolver<unknown> vs Resolver<number>.
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
                  CADASTRAR ANIMAL
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
        title={modalState.type === "success" ? "Sucesso!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />
    </>
  );
}
