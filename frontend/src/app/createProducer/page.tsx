"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Phone, Briefcase } from "lucide-react";

import {
  BrandHeader,
  ContentCard,
  InputField,
  CEPInputField,
  SelectField,
  RadioCardGroup,
  MultiStepForm,
  ErrorModal,
  PasswordStrength,
  AddressData,
  RadioCardOption,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { USER_CATEGORIES } from "@/constants/user-options";
import {
  producerStep1Schema,
  producerStep2Schema,
  producerStep3Schema,
  ProducerStep1Data,
  ProducerStep2Data,
  ProducerStep3Data,
  ProducerData,
} from "@/schemas/registration";
import { maskCPF, maskPhone } from "@/utils/masks";
import { useStates, useCities } from "@/hooks/queries/useLocation";
import { useMultiStepForm, useFormData } from "@/hooks/useMultiStepForm";
import { useCreateProducer } from "@/hooks/queries/useAuth";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

const formSteps = [
  {
    id: "step1",
    title: "Dados Básicos",
  },
  {
    id: "step2",
    title: "Contato",
  },
  {
    id: "step3",
    title: "Perfil",
  },
];

export default function CreateProducer() {
  const router = useRouter();
  const { currentStep, goToStep } = useMultiStepForm(3);
  const { formData, updateFormData } = useFormData<Partial<ProducerData>>({
    userCategory: "Fisica",
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  // Step 1: Basic Info
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

  // Step 2: Contact & Location
  const step2Form = useForm<ProducerStep2Data>({
    resolver: zodResolver(producerStep2Schema),
    mode: "onBlur",
    defaultValues: {
      cpf: formData.cpf || "",
      phone: formData.phone || "",
      state: formData.state || "",
      city: formData.city || "",
    },
  });

  const selectedState = step2Form.watch("state");
  const { data: estados = [] } = useStates();
  const { data: cidades = [], isLoading: isLoadingCities } = useCities(selectedState);

  // Step 3: Categorization
  const step3Form = useForm<ProducerStep3Data>({
    resolver: zodResolver(producerStep3Schema),
    mode: "onBlur",
    defaultValues: {
      userCategory: formData.userCategory || "Fisica",
      userType: formData.userType || "",
    },
  });

  const getCurrentForm = () => {
    switch (currentStep) {
      case 0:
        return step1Form;
      case 1:
        return step2Form;
      case 2:
        return step3Form;
      default:
        return step1Form;
    }
  };

  const handleStepChange = async (newStep: number) => {
    const currentForm = getCurrentForm();

    // Validate before progressing
    if (newStep > currentStep) {
      const isValid = await currentForm.trigger();
      if (!isValid) return;
    }

    // Save current step data
    updateFormData(currentForm.getValues());

    // Navigate
    goToStep(newStep);
  };


  const handleFinalSubmit = async () => {
    try {
      // Merge all step data
      const finalData: ProducerData = {
        ...(formData as ProducerData),
        ...step3Form.getValues(),
      };

      await createProducer(finalData);

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

  const handleCEPFound = (address: AddressData) => {
    step2Form.setValue("state", address.state);
    step2Form.setValue("city", address.city);
    // Trigger validation after setting values
    step2Form.trigger(["state", "city"]);
  };

  const { mutateAsync: createProducer, isPending } = useCreateProducer();
  // ... (handleFinalSubmit stays same)
  
  // ...
  const currentForm = getCurrentForm();
  const canGoNext = currentForm.formState.isValid;
  const isSubmitting = currentForm.formState.isSubmitting || isPending;

  // User type options for RadioCardGroup
  const userTypeOptions: RadioCardOption[] = USER_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
    description:
      cat === "Pecuarista"
        ? "Produção própria de leite"
        : cat === "Cooperativa"
        ? "Cooperado de associação"
        : cat === "Associacao"
        ? "Membro de associação"
        : "Outro tipo de produtor",
    icon: <Briefcase size={20} />,
  }));

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

        <div className="p-8 pb-6 max-h-[75vh] overflow-y-auto">
          <MultiStepForm
            steps={formSteps}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onSubmit={handleFinalSubmit}
            isSubmitting={isSubmitting}
            canGoNext={canGoNext}
          >
            {/* Step 1: Basic Info */}
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

            {/* Step 2: Contact & Location */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-brand-primary" />
                  Contato e Localização
                </h3>

                <InputField
                  label="CPF"
                  disabled={isSubmitting}
                  helperText="Seu CPF é usado apenas para identificação e não será compartilhado"
                  error={step2Form.formState.errors.cpf?.message}
                  {...step2Form.register("cpf")}
                  onChange={(e) => {
                    step2Form.setValue("cpf", maskCPF(e.target.value));
                  }}
                />

                <InputField
                  label="Telefone"
                  disabled={isSubmitting}
                  error={step2Form.formState.errors.phone?.message}
                  {...step2Form.register("phone")}
                  onChange={(e) => {
                    step2Form.setValue("phone", maskPhone(e.target.value));
                  }}
                />

                <CEPInputField
                  label="CEP (opcional)"
                  helperText="Digite seu CEP para preenchermos automaticamente o endereço"
                  onAddressFound={handleCEPFound}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Estado"
                    disabled={isSubmitting}
                    error={step2Form.formState.errors.state?.message}
                    {...step2Form.register("state")}
                    options={estadoOptions}
                    onChange={(e) => {
                      step2Form.setValue("state", e.target.value);
                      step2Form.setValue("city", "");
                    }}
                  />

                  <SelectField
                    label="Cidade"
                    disabled={isSubmitting || !selectedState || isLoadingCities}
                    error={step2Form.formState.errors.city?.message}
                    {...step2Form.register("city")}
                    options={cidadeOptions}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Categorization */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand-primary" />
                  Perfil de Produção
                </h3>

                <RadioCardGroup
                  label="Tipo de Produtor"
                  name="userType"
                  value={step3Form.watch("userType")}
                  onChange={(value) => {
                    step3Form.setValue("userType", value);
                    step3Form.trigger("userType");
                  }}
                  options={userTypeOptions}
                  error={step3Form.formState.errors.userType?.message}
                  helperText="Selecione a categoria que melhor descreve sua atividade"
                  columns={2}
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
