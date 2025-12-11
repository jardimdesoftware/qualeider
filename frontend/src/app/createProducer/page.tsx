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
import { Estado, Cidade } from "@/interfaces/location";
import { USER_CATEGORIES, sortByNamePtBr } from "@/constants/user-options";
import { producerSchema, ProducerData } from "@/schemas/registration";
import { maskCPF, maskPhone, cleanDocument } from "@/utils/masks";

export default function CreateProducer() {
  const router = useRouter();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

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

  // Fetch estados
  useState(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((res) => res.json())
      .then((data) => setEstados(sortByNamePtBr(data)))
      .catch(console.error);
  });

  // Fetch cidades quando estado muda
  useState(() => {
    if (selectedState) {
      fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`
      )
        .then((res) => res.json())
        .then((data) => setCidades(sortByNamePtBr(data)))
        .catch(console.error);
    } else {
      setCidades([]);
    }
  });

  const onSubmit = async (data: ProducerData) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        cpf: cleanDocument(data.cpf),
        phone: cleanDocument(data.phone),
        state: data.state,
        city: data.city,
        userCategory: data.userCategory,
        userType: data.userType,
      };

      await apiBase.post("/users", payload);
      
      setModalType("success");
      setModalMessage("Produtor cadastrado com sucesso!");
      setShowModal(true);
    } catch (err: any) {
      console.error(err);
      setModalType("error");
      setModalMessage(
        err.response?.data?.message || "Erro ao cadastrar produtor."
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

  const userTypeOptions = USER_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat === "Associacao" ? "Associação" : cat,
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
          title="Cadastro de Produtor"
          subtitle="Preencha seus dados para começar"
        />

        <div className="p-8 pb-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Nome Completo"
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
              label="CPF"
              type="text"
              disabled={isSubmitting}
              error={errors.cpf?.message}
              {...register("cpf")}
              onChange={(e) => {
                const masked = maskCPF(e.target.value);
                setValue("cpf", masked);
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
              label="Tipo de Pessoa"
              disabled={isSubmitting}
              error={errors.userCategory?.message}
              {...register("userCategory")}
              options={[
                { value: "Fisica", label: "Física" },
                { value: "Juridica", label: "Jurídica" },
              ]}
            />

            <SelectField
              label="Categoria"
              disabled={isSubmitting}
              error={errors.userType?.message}
              {...register("userType")}
              options={userTypeOptions}
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
