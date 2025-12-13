"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BrandHeader,
  ContentCard,
  InputField,
  SelectField,
  Button,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { USER_CATEGORIES } from "@/constants/user-options";
import { producerSchema, ProducerData } from "@/schemas/registration";
import { maskCPF, maskPhone } from "@/utils/masks";
import { useLocation } from "@/hooks/useLocation";
import { producerService } from "@/services/producerService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

export default function CreateProducer() {
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
  } = useForm<ProducerData>({
    resolver: zodResolver(producerSchema),
    mode: "onBlur",
    defaultValues: {
      userCategory: "Fisica",
      userType: "",
    },
  });

  const selectedState = watch("state");
  const { estados, cidades, isLoadingCities } = useLocation(selectedState);

  const onSubmit = async (data: ProducerData) => {
    try {
      await producerService.create(data);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Cadastro realizado com sucesso!",
      });
    } catch (err) {
      console.error(err);
      setModalState({
        isOpen: true,
        type: "error",
        message: getFriendlyErrorMessage(err),
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
          title="Cadastro de Produtor"
          subtitle="Registre-se como produtor"
        />

        <div className="p-8 pb-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Nome Completo"
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
              label="CPF"
              disabled={isSubmitting}
              error={errors.cpf?.message}
              {...register("cpf")}
              onChange={(e) => {
                setValue("cpf", maskCPF(e.target.value));
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
              label="Tipo de Produtor"
              disabled={isSubmitting}
              error={errors.userType?.message}
              {...register("userType")}
              options={USER_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
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
              >
                {isSubmitting ? "CADASTRANDO..." : "CADASTRAR"}
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => router.push("/createAccount")}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
            </div>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors"
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
