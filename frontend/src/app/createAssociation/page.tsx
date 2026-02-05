"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, FileText, MapPin } from "lucide-react";

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
import {
  associationStep1Schema,
  associationStep2Schema,
  associationStep3Schema,
  AssociationStep1Data,
  AssociationStep2Data,
  AssociationStep3Data,
  AssociationData,
} from "@/schemas/registration";
import { maskCNPJ, maskPhone } from "@/utils/masks";
import { useStates, useCities } from "@/hooks/queries/useLocation";
import { useMultiStepForm, useFormData } from "@/hooks/useMultiStepForm";
import { useCreateAssociation } from "@/hooks/queries/useAuth";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

const formSteps = [
  {
    id: "step1",
    title: "Dados Básicos",
  },
  {
    id: "step2",
    title: "Documentação",
  },
  {
    id: "step3",
    title: "Localização",
  },
];

export default function CreateAssociation() {
  const router = useRouter();
  const { currentStep, goToStep } = useMultiStepForm(3);
  const { formData, updateFormData } = useFormData<Partial<AssociationData>>({
    userCategory: "Juridica",
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  // Step 1: Basic Info
  const step1Form = useForm<AssociationStep1Data>({
    resolver: zodResolver(associationStep1Schema),
    mode: "onBlur",
    defaultValues: {
      name: formData.name || "",
      email: formData.email || "",
      password: formData.password || "",
      confirmPassword: formData.confirmPassword || "",
    },
  });

  // Step 2: Documentation & Contact
  const step2Form = useForm<AssociationStep2Data>({
    resolver: zodResolver(associationStep2Schema),
    mode: "onBlur",
    defaultValues: {
      cnpj: formData.cnpj || "",
      phone: formData.phone || "",
    },
  });

  // Step 3: Location & Coverage
  const step3Form = useForm<AssociationStep3Data>({
    resolver: zodResolver(associationStep3Schema),
    mode: "onBlur",
    defaultValues: {
      state: formData.state || "",
      city: formData.city || "",
      userCategory: "Juridica",
      coverageArea: formData.coverageArea || "Municipal",
    },
  });

  const selectedState = step3Form.watch("state");
  const { data: estados = [] } = useStates();
  const { data: cidades = [], isLoading: isLoadingCities } = useCities(selectedState);

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

  const { mutateAsync: createAssociation, isPending } = useCreateAssociation();

  const handleFinalSubmit = async () => {
    try {
      // Merge all step data
      const finalData: AssociationData = {
        ...(formData as AssociationData),
        ...step3Form.getValues(),
      };

      await createAssociation(finalData);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Associação cadastrada com sucesso!",
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
    step3Form.setValue("state", address.state);
    step3Form.setValue("city", address.city);
    // Trigger validation after setting values
    step3Form.trigger(["state", "city"]);
  };

  const currentForm = getCurrentForm();
  const canGoNext = currentForm.formState.isValid;
  const isSubmitting = currentForm.formState.isSubmitting || isPending;

  // Coverage area options for RadioCardGroup
  const coverageOptions: RadioCardOption[] = [
    {
      value: "Municipal",
      label: "Municipal",
      description: "Um município",
      icon: <MapPin size={20} />,
    },
    {
      value: "Regional",
      label: "Regional",
      description: "Vários municípios",
      icon: <MapPin size={20} />,
    },
    {
      value: "Estadual",
      label: "Estadual",
      description: "Todo o estado",
      icon: <MapPin size={20} />,
    },
  ];

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
                  <Building2 className="w-5 h-5 text-brand-secondary" />
                  Credenciais de Acesso
                </h3>

                <InputField
                  label="Nome da Associação"
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

            {/* Step 2: Documentation & Contact */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-secondary" />
                  Documentação e Contato
                </h3>

                <InputField
                  label="CNPJ"
                  disabled={isSubmitting}
                  helperText="Necessário para validar a associação junto ao cadastro nacional"
                  error={step2Form.formState.errors.cnpj?.message}
                  {...step2Form.register("cnpj")}
                  onChange={(e) => {
                    step2Form.setValue("cnpj", maskCNPJ(e.target.value));
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
              </div>
            )}

            {/* Step 3: Location & Coverage */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-secondary" />
                  Localização e Abrangência
                </h3>

                <CEPInputField
                  label="CEP (opcional)"
                  helperText="Digite o CEP para preenchermos automaticamente o endereço"
                  onAddressFound={handleCEPFound}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Estado"
                    disabled={isSubmitting}
                    error={step3Form.formState.errors.state?.message}
                    {...step3Form.register("state")}
                    options={estadoOptions}
                    onChange={(e) => {
                      step3Form.setValue("state", e.target.value);
                      step3Form.setValue("city", "");
                    }}
                  />

                  <SelectField
                    label="Cidade"
                    disabled={isSubmitting || !selectedState || isLoadingCities}
                    error={step3Form.formState.errors.city?.message}
                    {...step3Form.register("city")}
                    options={cidadeOptions}
                  />
                </div>

                <RadioCardGroup
                  label="Área de Abrangência"
                  name="coverageArea"
                  value={step3Form.watch("coverageArea")}
                  onChange={(value) => {
                    step3Form.setValue("coverageArea", value as any);
                    step3Form.trigger("coverageArea");
                  }}
                  options={coverageOptions}
                  error={step3Form.formState.errors.coverageArea?.message}
                  columns={1}
                />
              </div>
            )}
          </MultiStepForm>

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
