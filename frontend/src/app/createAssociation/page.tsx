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
import { apiBase } from "@/services/baseApi";
import { associationSchema, AssociationData } from "@/schemas/registration";
import { maskCNPJ, maskPhone, cleanDocument } from "@/utils/masks";
import { useLocation } from "@/hooks/useLocation";

export default function CreateAssociation() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

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
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        cnpj: cleanDocument(data.cnpj),
        phone: cleanDocument(data.phone),
        state: data.state,
        city: data.city,
        userCategory: "Juridica",
        coverageArea: data.coverageArea,
      };

      await apiBase.post("/associations", payload);
      
      setModalType("success");
      setModalMessage("Associação cadastrada com sucesso!");
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
      setModalType("error");
      setModalMessage(
        err.response?.data?.message || "Erro ao cadastrar associação."
      );
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === "success") {
      router.push("/login");
    }
  };

  const estadoOptions = estados.map((e) => ({
    value: e.sigla,
    label: e.nome,
  }));

  const cidadeOptions = cidades.map((c) => ({
    value: c.nome,
    label: c.nome,
  }));

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalType === "success" ? "Sucesso!" : "Erro"}
        message={modalMessage}
        type={modalType}
      />

      <ContentCard className="max-w-2xl">
        <BrandHeader
          title="Cadastro de Associação"
          subtitle="Registre sua associação"
        />

        <div className="p-8 pb-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Nome da Associação"
              type="text"
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
              type="text"
              disabled={isSubmitting}
              error={errors.cnpj?.message}
              {...register("cnpj")}
              onChange={(e) => {
                const masked = maskCNPJ(e.target.value);
                setValue("cnpj", masked);
              }}
            />

            <InputField
              label="Telefone"
              type="text"
              disabled={isSubmitting}
              error={errors.phone?.message}
              {...register("phone")}
              onChange={(e) => {
                const masked = maskPhone(e.target.value);
                setValue("phone", masked);
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
                disabled={isSubmitting || !selectedState}
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
