"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import {
  BrandHeader,
  ContentCard,
  InputField,
  SelectField,
  Button,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { associationSchema, AssociationData } from "@/schemas/registration";
import { maskCNPJ, maskPhone } from "@/utils/masks";
import { useLocation } from "@/hooks/useLocation";
import { associationService } from "@/services/associationService";

export default function CreateAssociation() {
  const router = useRouter();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssociationData>({
    resolver: zodResolver(associationSchema),
    mode: "onBlur",
    defaultValues: {
      userCategory: "Juridica",
    },
  });

  const selectedState = watch("state");
  const { estados, cidades, isLoadingCities } = useLocation(selectedState);

  const onSubmit = async (data: AssociationData) => {
    try {
      await associationService.create(data);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Associação cadastrada com sucesso!",
      });
    } catch (err) {
      console.error(err);
      const error = err as AxiosError<{ message: string }>;

      setModalState({
        isOpen: true,
        type: "error",
        message: error.response?.data?.message || "Erro ao cadastrar associação.",
      });
    }
  };

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.type === "success") {
      router.push("/login");
    }
  };

  const estadoOptions = estados.map((e) => ({ value: e.sigla, label: e.nome }));
  const cidadeOptions = cidades.map((c) => ({ value: c.nome, label: c.nome }));

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.type === "success" ? "Sucesso!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />

      <ContentCard className="max-w-2xl">
        <BrandHeader
          title="Cadastro de Associação"
          subtitle="Registre sua associação"
          className="bg-brand-secondary"
        />

        <div className="p-8 pb-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Nome da Associação"
              disabled={isSubmitting}
              error={errors.name?.message}
              {...register("name")}
            />

            <InputField
              label="E-mail"
              type="email"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />

            <InputField
              label="CNPJ"
              disabled={isSubmitting}
              error={errors.cnpj?.message}
              {...register("cnpj")}
              onChange={(e) => {
                setValue("cnpj", maskCNPJ(e.target.value));
              }}
            />

            <InputField
              label="Telefone"
              disabled={isSubmitting}
              error={errors.phone?.message}
              {...register("phone")}
              onChange={(e) => {
                setValue("phone", maskPhone(e.target.value));
              }}
            />

            <SelectField
              label="Abrangência"
              disabled={isSubmitting}
              error={errors.coverageArea?.message}
              {...register("coverageArea")}
              options={[
                { value: "Municipal", label: "Municipal" },
                { value: "Regional", label: "Regional" },
                { value: "Estadual", label: "Estadual" },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Estado"
                disabled={isSubmitting}
                error={errors.state?.message}
                {...register("state")}
                options={estadoOptions}
                onChange={(e) => {
                  setValue("state", e.target.value);
                  setValue("city", "");
                }}
              />

              <SelectField
                label="Cidade"
                disabled={isSubmitting || !selectedState || isLoadingCities}
                error={errors.city?.message}
                {...register("city")}
                options={cidadeOptions}
              />
            </div>

            <InputField
              label="Senha"
              showPasswordToggle
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />

            <InputField
              label="Confirmar Senha"
              showPasswordToggle
              disabled={isSubmitting}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting}
                className="bg-brand-secondary hover:bg-brand-secondary/90 border-transparent"
              >
                {isSubmitting ? "CADASTRANDO..." : "CADASTRAR"}
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => router.push("/createAccount")}
                disabled={isSubmitting}
                className="text-brand-secondary border-brand-secondary hover:bg-brand-secondary/10"
              >
                Voltar
              </Button>
            </div>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-brand-secondary hover:text-brand-secondary/80 font-semibold transition-colors"
            >
              Fazer Login
            </Link>
          </p>
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
