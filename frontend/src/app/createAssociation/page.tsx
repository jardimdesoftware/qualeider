"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import {
  BrandHeader,
  ContentCard,
  InputField,
  SelectField,
  Button,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { AssociationService } from "@/services/association.service";
import { CoverageArea, Status } from "@/interfaces/association";
import { useLocationData } from "@/hooks/useLocationData";
import {
  cleanDocument,
  formatCNPJ,
  formatCPF,
  validateCNPJ,
  validateCPF,
  isNotEmpty,
  isValidEmail,
  isValidPassword,
  passwordsMatch,
} from "@/utils";

export default function CreateAssociation() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    tradeName: "",
    cnpj: "",
    email: "",
    password: "",
    confirmPassword: "",
    landlinePhone: "",
    mobilePhone: "",
    zipCode: "",
    state: "",
    city: "",
    street: "",
    number: "",
    neighborhood: "",
    coverageArea: "",
    presidentName: "",
    presidentCpf: "",
    presidentEmail: "",
    presidentPhone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { estados, cidades } = useLocationData(formData.state);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    }
    return cleaned.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, "($1) $2 $3-$4");
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned.replace(/(\d{5})(\d{0,3})/, "$1-$2");
  };

  const validateStep1 = () => {
    let valid = true;
    if (!isNotEmpty(formData.name)) {
      setErrors((prev) => ({
        ...prev,
        name: "Razão Social é obrigatória",
      }));
      valid = false;
    }
    if (!validateCNPJ(formData.cnpj)) {
      setErrors((prev) => ({ ...prev, cnpj: "CNPJ inválido" }));
      valid = false;
    }
    if (!isValidEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Email inválido" }));
      valid = false;
    }
    if (!isValidPassword(formData.password, 8)) {
      setErrors((prev) => ({
        ...prev,
        password: "Senha deve ter no mínimo 8 caracteres",
      }));
      valid = false;
    }
    if (!passwordsMatch(formData.password, formData.confirmPassword)) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "As senhas não coincidem",
      }));
      valid = false;
    }
    return valid;
  };

  const validateStep2 = () => {
    return (
      formData.landlinePhone.replace(/\D/g, "").length >= 10 &&
      formData.zipCode.replace(/\D/g, "").length === 8 &&
      formData.state &&
      formData.city &&
      formData.street &&
      formData.number &&
      formData.neighborhood
    );
  };

  const handleNext = async () => {
    if (step === 1 && validateStep1()) {
      try {
        const [emailResp, cnpjResp] = await Promise.all([
          AssociationService.checkEmail(formData.email),
          AssociationService.checkCnpj(cleanDocument(formData.cnpj)),
        ]);

        if (emailResp.exists) {
          setErrors((prev) => ({ ...prev, email: "Email já cadastrado" }));
          return;
        }
        if (cnpjResp.exists) {
          setErrors((prev) => ({ ...prev, cnpj: "CNPJ já cadastrado" }));
          return;
        }
        setStep(2);
      } catch {
        setStep(2);
      }
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!formData.coverageArea || !formData.presidentName) {
      setErrorMessage("Preencha todos os campos obrigatórios");
      setShowErrorModal(true);
      return;
    }

    if (!validateCPF(formData.presidentCpf)) {
      setErrors((prev) => ({ ...prev, presidentCpf: "CPF inválido" }));
      return;
    }

    setLoading(true);

    try {
      await AssociationService.create({
        name: formData.name,
        tradeName: formData.tradeName || undefined,
        cnpj: cleanDocument(formData.cnpj),
        stateRegistration: undefined,
        email: formData.email,
        password: formData.password,
        landlinePhone: formData.landlinePhone.replace(/\D/g, ""),
        mobilePhone: formData.mobilePhone
          ? formData.mobilePhone.replace(/\D/g, "")
          : undefined,
        website: undefined,
        zipCode: formData.zipCode.replace(/\D/g, ""),
        state: formData.state,
        city: formData.city,
        street: formData.street,
        number: formData.number,
        complement: undefined,
        neighborhood: formData.neighborhood,
        foundationDate: undefined,
        numberOfMembers: undefined,
        coverageArea: formData.coverageArea as CoverageArea,
        presidentName: formData.presidentName,
        presidentCpf: cleanDocument(formData.presidentCpf),
        presidentEmail: formData.presidentEmail,
        presidentPhone: formData.presidentPhone.replace(/\D/g, ""),
        status: Status.Active,
      });

      setShowSuccessModal(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "Erro ao criar associação"
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={showSuccessModal}
        onClose={() => {}}
        title="Sucesso!"
        message="Associação criada com sucesso! Redirecionando..."
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <ContentCard className="max-w-2xl">
        <BrandHeader
          title="QualeiDer"
          subtitle="Controle de sua produção leiteira"
        />

        <div className="p-8 pb-6">
          <Link
            href="/createAccount"
            className="inline-flex items-center text-brand-primary hover:text-brand-primary-hover font-semibold text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Voltar
          </Link>

          <h2 className="text-brand-primary text-2xl font-bold text-center mb-2">
            Cadastro de Associação
          </h2>
          <p className="text-gray-600 text-center text-sm mb-6">
            Etapa {step} de 3
          </p>

          <div className="mb-4">
            <div className="flex justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded ${
                    s <= step ? "bg-brand-primary" : "bg-gray-200"
                  } ${s !== 3 ? "mr-2" : ""}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {step === 1 && (
              <>
                <InputField
                  label="Razão Social"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={errors.name}
                  placeholder="Associação dos Produtores..."
                />
                <InputField
                  label="Nome Fantasia"
                  value={formData.tradeName}
                  onChange={(e) =>
                    setFormData({ ...formData, tradeName: e.target.value })
                  }
                />
                <InputField
                  label="CNPJ"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cnpj: formatCNPJ(e.target.value),
                    })
                  }
                  error={errors.cnpj}
                  placeholder="00.000.000/0000-00"
                />
                <InputField
                  label="E-mail Institucional"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  error={errors.email}
                  placeholder="contato@associacao.org.br"
                />
                <InputField
                  label="Senha"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                  showPasswordToggle
                />
                <InputField
                  label="Confirmar Senha"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={errors.confirmPassword}
                  showPasswordToggle
                />
              </>
            )}

            {step === 2 && (
              <>
                <InputField
                  label="Telefone Fixo"
                  value={formData.landlinePhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      landlinePhone: formatPhone(e.target.value),
                    })
                  }
                  placeholder="(87) 3721-1234"
                />
                <InputField
                  label="Telefone Celular"
                  value={formData.mobilePhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mobilePhone: formatPhone(e.target.value),
                    })
                  }
                  placeholder="(87) 9 9999-9999"
                />
                <InputField
                  label="CEP"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      zipCode: formatCEP(e.target.value),
                    })
                  }
                  placeholder="55155-000"
                />
                <SelectField
                  label="Estado"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                      city: "",
                    })
                  }
                  options={estados.map((e) => ({
                    value: e.sigla,
                    label: e.nome,
                  }))}
                />
                <SelectField
                  label="Cidade"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  options={cidades.map((c) => ({
                    value: c.nome,
                    label: c.nome,
                  }))}
                  disabled={!formData.state}
                />
                <InputField
                  label="Rua/Avenida"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Número"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                  />
                  <InputField
                    label="Bairro"
                    value={formData.neighborhood}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        neighborhood: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <SelectField
                  label="Área de Atuação"
                  value={formData.coverageArea}
                  onChange={(e) =>
                    setFormData({ ...formData, coverageArea: e.target.value })
                  }
                  options={[
                    { value: CoverageArea.Municipal, label: "Municipal" },
                    { value: CoverageArea.Regional, label: "Regional" },
                    { value: CoverageArea.State, label: "Estadual" },
                    { value: CoverageArea.National, label: "Nacional" },
                  ]}
                />
                <InputField
                  label="Nome do Presidente"
                  value={formData.presidentName}
                  onChange={(e) =>
                    setFormData({ ...formData, presidentName: e.target.value })
                  }
                />
                <InputField
                  label="CPF do Presidente"
                  value={formData.presidentCpf}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      presidentCpf: formatCPF(e.target.value),
                    })
                  }
                  error={errors.presidentCpf}
                />
                <InputField
                  label="E-mail do Presidente"
                  type="email"
                  value={formData.presidentEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      presidentEmail: e.target.value,
                    })
                  }
                />
                <InputField
                  label="Telefone do Presidente"
                  value={formData.presidentPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      presidentPhone: formatPhone(e.target.value),
                    })
                  }
                />
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex-1"
              >
                <ChevronLeft size={18} className="mr-1" />
                ANTERIOR
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                fullWidth={step === 1}
                className={step > 1 ? "flex-1" : ""}
              >
                PRÓXIMO
                <ChevronRight size={18} className="ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                className="flex-1"
              >
                CADASTRAR
              </Button>
            )}
          </div>

          <p className="text-center text-gray-600 text-sm mt-6">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
