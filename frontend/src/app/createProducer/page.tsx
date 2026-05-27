"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Phone } from "lucide-react";

import {
  BrandHeader,
  ContentCard,
  InputField,
  MultiStepForm,
  ErrorModal,
  PasswordStrength,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import {
  producerStep1Schema,
  producerStep2Schema,
  ProducerStep1Data,
  ProducerStep2Data,
  ProducerData,
} from "@/schemas/registration";
import { maskCPF, maskPhone } from "@/utils/masks";
import { useMultiStepForm, useFormData } from "@/hooks/useMultiStepForm";
import { useCreateProducer } from "@/hooks/queries/useAuth";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

const formSteps = [
  { id: "step1", title: "Dados Básicos" },
  { id: "step2", title: "Contato" },
];

export default function CreateProducer() {
  const router = useRouter();
  const { currentStep, goToStep } = useMultiStepForm(2);
  const { formData, updateFormData } = useFormData<Partial<ProducerData>>({
    userCategory: "Fisica",
    userType: "Pecuarista",
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  // Step 1: Dados Básicos
  const step1Form = useForm<ProducerStep1Data>({
    resolver: zodResolver(producerStep1Schema),
    mode: "onBlur",
    defaultValues: {
      name: formData.name || "",
      email: formData.email || "",
      password: formData.password || "",
      confirmPassword: formData.confirmPassword || "",
    },
  });

  // Step 2: Contato — state/city são hardcoded (IFPE Belo Jardim / PE)
  const step2Form = useForm<ProducerStep2Data>({
    resolver: zodResolver(producerStep2Schema),
    mode: "onBlur",
    defaultValues: {
      cpf: formData.cpf || "",
      phone: formData.phone || "",
    },
  });

  const getCurrentForm = () => (currentStep === 0 ? step1Form : step2Form);

  const handleStepChange = async (newStep: number) => {
    const currentForm = getCurrentForm();
    if (newStep > currentStep) {
      const isValid = await currentForm.trigger();
      if (!isValid) return;
    }
    updateFormData(currentForm.getValues());
    goToStep(newStep);
  };

  const { mutateAsync: createProducer, isPending } = useCreateProducer();

  const handleFinalSubmit = async () => {
    const isValid = await step2Form.trigger();
    if (!isValid) return;

    try {
      const finalData: ProducerData = {
        ...(formData as ProducerData),
        ...step2Form.getValues(),
        state: "PE",
        city: "Belo Jardim",
        userCategory: "Fisica",
        userType: "Pecuarista",
      };

      await createProducer(finalData);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Cadastro realizado com sucesso!",
      });
    } catch (err) {
      setModalState({
        isOpen: true,
        type: "error",
        message: getFriendlyErrorMessage(err),
      });
    }
  };

  const handleModalClose = () => {
    const wasSuccess = modalState.type === "success";
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (wasSuccess) {
      router.push("/login");
    }
  };

  const isSubmitting = isPending;

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.type === "success" ? "Sucesso!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />

      <ContentCard className="max-w-2xl w-full">
        <BrandHeader
          title="Criar minha conta"
          subtitle="Cadastro do Administrador da Fazenda"
        />

        <div className="px-6 py-6 md:px-8 md:py-8 pb-4 max-h-[80vh] overflow-y-auto">
          <MultiStepForm
            steps={formSteps}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onSubmit={handleFinalSubmit}
            isSubmitting={isSubmitting}
            canGoNext={true}
          >
            {/* Step 1: Dados Básicos */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-primary" />
                  Credenciais de Acesso
                </h3>

                <InputField
                  label="Nome Completo"
                  disabled={isSubmitting}
                  error={step1Form.formState.errors.name?.message}
                  {...step1Form.register("name")}
                />

                <InputField
                  label="E-mail"
                  type="email"
                  disabled={isSubmitting}
                  helperText="Será usado para fazer login na plataforma"
                  error={step1Form.formState.errors.email?.message}
                  {...step1Form.register("email")}
                />

                <div className="space-y-2">
                  <InputField
                    label="Senha"
                    showPasswordToggle
                    disabled={isSubmitting}
                    error={step1Form.formState.errors.password?.message}
                    {...step1Form.register("password")}
                  />
                  <PasswordStrength password={step1Form.watch("password") || ""} />
                </div>

                <InputField
                  label="Confirmar Senha"
                  showPasswordToggle
                  disabled={isSubmitting}
                  helperText="Você pode colar sua senha aqui para confirmar"
                  error={step1Form.formState.errors.confirmPassword?.message}
                  {...step1Form.register("confirmPassword")}
                />
              </div>
            )}

            {/* Step 2: Contato */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-brand-primary" />
                  Dados de Contato
                </h3>

                <InputField
                  label="CPF"
                  disabled={isSubmitting}
                  helperText="Seu CPF é usado apenas para identificação"
                  error={step2Form.formState.errors.cpf?.message}
                  {...step2Form.register("cpf")}
                  onChange={(e) =>
                    step2Form.setValue("cpf", maskCPF(e.target.value))
                  }
                />

                <InputField
                  label="Telefone"
                  disabled={isSubmitting}
                  error={step2Form.formState.errors.phone?.message}
                  {...step2Form.register("phone")}
                  onChange={(e) =>
                    step2Form.setValue("phone", maskPhone(e.target.value))
                  }
                />
              </div>
            )}
          </MultiStepForm>

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
