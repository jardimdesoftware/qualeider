"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Wave from "@/components/global/waveFooter";
import Button from "@/components/global/button";
import { apiBase } from "@/services/baseApi";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLocationData } from "@/hooks/useLocationData";
import {
  cleanDocument,
  formatCNPJ,
  formatCPF,
  validateCNPJ,
  validateCPF,
} from "@/utils/document-utils";
import {
  isNotEmpty,
  isValidEmail,
  isValidPassword,
  passwordsMatch,
} from "@/utils/validation-utils";
import InfoSidebar from "@/components/global/InfoSidebar";
import { associationSidebarData } from "@/constants/sidebarData";
import Footer from "@/components/global/Footer";

export default function CreateAssociation() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // TELA 1: Dados Básicos
    name: "",
    tradeName: "",
    cnpj: "",
    stateRegistration: "",
    email: "",
    password: "",
    confirmPassword: "",

    // TELA 2: Contato e Endereço
    landlinePhone: "",
    mobilePhone: "",
    website: "",
    zipCode: "",
    state: "",
    city: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",

    // TELA 3: Informações Complementares e Responsável
    foundationDate: "",
    numberOfMembers: "",
    coverageArea: "",
    presidentName: "",
    presidentCpf: "",
    presidentEmail: "",
    presidentPhone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showWave, setShowWave] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollThreshold = 0.8;
      setShowWave(scrollPosition > maxScroll * scrollThreshold);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isMobile = useIsMobile();
  const { estados, cidades } = useLocationData(formData.state);

  const validateName = (name: string) => {
    if (!isNotEmpty(name)) {
      setErrors((prev) => ({ ...prev, name: "Razão Social é obrigatória" }));
    } else if (name.length < 3) {
      setErrors((prev) => ({
        ...prev,
        name: "Razão Social deve ter pelo menos 3 caracteres",
      }));
    } else {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const validateCNPJField = (cnpj: string) => {
    if (!isNotEmpty(cnpj)) {
      setErrors((prev) => ({ ...prev, cnpj: "CNPJ é obrigatório" }));
    } else if (cleanDocument(cnpj).length !== 14) {
      setErrors((prev) => ({ ...prev, cnpj: "CNPJ deve ter 14 dígitos" }));
    } else if (!validateCNPJ(cnpj)) {
      setErrors((prev) => ({ ...prev, cnpj: "CNPJ inválido" }));
    } else {
      setErrors((prev) => ({ ...prev, cnpj: "" }));
    }
  };

  const validateEmailField = (email: string) => {
    if (!isNotEmpty(email)) {
      setErrors((prev) => ({ ...prev, email: "Email é obrigatório" }));
    } else if (!isValidEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Email inválido" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const validatePasswordField = (password: string) => {
    if (!isNotEmpty(password)) {
      setErrors((prev) => ({ ...prev, password: "Senha é obrigatória" }));
    } else if (!isValidPassword(password, 8)) {
      setErrors((prev) => ({
        ...prev,
        password: "Senha deve ter pelo menos 8 caracteres",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const validateConfirmPasswordField = (confirmPassword: string) => {
    if (!isNotEmpty(confirmPassword)) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Confirme a senha" }));
    } else if (!passwordsMatch(formData.password, confirmPassword)) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "As senhas não coincidem",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const validatePhone = (phone: string, fieldName: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!isNotEmpty(phone)) {
      setErrors((prev) => ({ ...prev, [fieldName]: "Telefone é obrigatório" }));
    } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "Telefone inválido",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const validateCEP = (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
    if (!isNotEmpty(cep)) {
      setErrors((prev) => ({ ...prev, zipCode: "CEP é obrigatório" }));
    } else if (cleanCEP.length !== 8) {
      setErrors((prev) => ({ ...prev, zipCode: "CEP deve ter 8 dígitos" }));
    } else {
      setErrors((prev) => ({ ...prev, zipCode: "" }));
    }
  };

  const validatePresidentCPF = (cpf: string) => {
    if (!isNotEmpty(cpf)) {
      setErrors((prev) => ({
        ...prev,
        presidentCpf: "CPF do presidente é obrigatório",
      }));
    } else if (cleanDocument(cpf).length !== 11) {
      setErrors((prev) => ({
        ...prev,
        presidentCpf: "CPF deve ter 11 dígitos",
      }));
    } else if (!validateCPF(cpf)) {
      setErrors((prev) => ({ ...prev, presidentCpf: "CPF inválido" }));
    } else {
      setErrors((prev) => ({ ...prev, presidentCpf: "" }));
    }
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setFormData({ ...formData, cnpj: formatted });
    validateCNPJField(formatted);
  };

  const handlePhoneChange = (value: string, fieldName: string) => {
    const cleaned = value.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length <= 10) {
      // (XX) XXXX-XXXX
      formatted = cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      // (XX) X XXXX-XXXX
      formatted = cleaned.replace(
        /(\d{2})(\d{1})(\d{4})(\d{0,4})/,
        "($1) $2 $3-$4"
      );
    }

    setFormData({ ...formData, [fieldName]: formatted });
    validatePhone(formatted, fieldName);
  };

  const handleCEPChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{5})(\d{0,3})/, "$1-$2");
    setFormData({ ...formData, zipCode: formatted });
    validateCEP(formatted);
  };

  const handlePresidentCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData({ ...formData, presidentCpf: formatted });
    validatePresidentCPF(formatted);
  };

  const handleNextStep = async () => {
    if (step === 1) {
      validateName(formData.name);
      validateCNPJField(formData.cnpj);
      validateEmailField(formData.email);
      validatePasswordField(formData.password);
      validateConfirmPasswordField(formData.confirmPassword);

      if (
        !formData.name ||
        !formData.cnpj ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword ||
        errors.name ||
        errors.cnpj ||
        errors.email ||
        errors.password ||
        errors.confirmPassword
      ) {
        return;
      }

      // Verifica email e CNPJ duplicados
      try {
        const [emailResp, cnpjResp] = await Promise.all([
          apiBase.get<{ exists: boolean }>("/associations/check-email", {
            params: { email: formData.email },
          }),
          apiBase.get<{ exists: boolean }>("/associations/check-cnpj", {
            params: { cnpj: cleanDocument(formData.cnpj) },
          }),
        ]);

        if (emailResp.data.exists) {
          setErrors((prev) => ({ ...prev, email: "Email já cadastrado" }));
          return;
        }

        if (cnpjResp.data.exists) {
          setErrors((prev) => ({ ...prev, cnpj: "CNPJ já cadastrado" }));
          return;
        }

        setStep(2);
      } catch {
        setStep(2);
      }
    } else if (step === 2) {
      validatePhone(formData.landlinePhone, "landlinePhone");
      validateCEP(formData.zipCode);

      if (
        !formData.landlinePhone ||
        !formData.zipCode ||
        !formData.state ||
        !formData.city ||
        !formData.street ||
        !formData.number ||
        !formData.neighborhood ||
        errors.landlinePhone ||
        errors.zipCode ||
        errors.state ||
        errors.city ||
        errors.street ||
        errors.number ||
        errors.neighborhood
      ) {
        return;
      }

      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.coverageArea) {
      setErrors((prev) => ({
        ...prev,
        coverageArea: "Área de atuação é obrigatória",
      }));
      return;
    }

    if (!formData.presidentName) {
      setErrors((prev) => ({
        ...prev,
        presidentName: "Nome do presidente é obrigatório",
      }));
      return;
    }

    validatePresidentCPF(formData.presidentCpf);
    validateEmailField(formData.presidentEmail);
    validatePhone(formData.presidentPhone, "presidentPhone");

    if (errors.presidentCpf || errors.presidentEmail || errors.presidentPhone) {
      return;
    }

    setLoading(true);

    const associationData = {
      name: formData.name,
      tradeName: formData.tradeName || undefined,
      cnpj: cleanDocument(formData.cnpj),
      stateRegistration: formData.stateRegistration || undefined,
      email: formData.email,
      password: formData.password,
      landlinePhone: formData.landlinePhone.replace(/\D/g, ""),
      mobilePhone: formData.mobilePhone
        ? formData.mobilePhone.replace(/\D/g, "")
        : undefined,
      website: formData.website || undefined,
      zipCode: formData.zipCode.replace(/\D/g, ""),
      state: formData.state,
      city: formData.city,
      street: formData.street,
      number: formData.number,
      complement: formData.complement || undefined,
      neighborhood: formData.neighborhood,
      foundationDate: formData.foundationDate || undefined,
      numberOfMembers: formData.numberOfMembers
        ? parseInt(formData.numberOfMembers)
        : undefined,
      coverageArea: formData.coverageArea,
      presidentName: formData.presidentName,
      presidentCpf: cleanDocument(formData.presidentCpf),
      presidentEmail: formData.presidentEmail,
      presidentPhone: formData.presidentPhone.replace(/\D/g, ""),
    };

    try {
      const response = await apiBase.post("/associations", associationData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setShowSuccessPopup(true);
      } else {
        setErrorMessage("Erro ao criar associação. Tente novamente.");
        setShowErrorPopup(true);
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const err = error as { response?: { data?: { message?: string } } };
        setErrorMessage(
          err.response?.data?.message || "Erro ao criar associação."
        );
      } else {
        setErrorMessage("Erro ao criar associação. Tente novamente.");
      }
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    if (showSuccessPopup) {
      setShowSuccessPopup(false);
      router.push("/login");
    } else if (showErrorPopup) {
      setShowErrorPopup(false);
    }
  };

  return (
    <main
      className={`flex justify-center items-center min-h-screen p-8 ${
        isMobile ? "bg-green-background" : ""
      }`}
    >
      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center z-50">
            <h2 className="text-xl font-bold text-green-600 mb-4">
              Associação Cadastrada!
            </h2>
            <p className="text-gray-700 mb-4">
              Sua associação foi criada com sucesso. Redirecionando para o
              login...
            </p>
            <button
              onClick={closePopup}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Popup de Erro */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center z-50">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Erro ao Cadastrar
            </h2>
            <p className="text-gray-700 mb-4">
              {errorMessage ||
                "Ocorreu um erro ao tentar criar sua associação."}
            </p>
            <button
              onClick={closePopup}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Cadastro de Associação
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Etapa {step} de 3
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    validateName(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Associação dos Produtores de Leite..."
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) =>
                    setFormData({ ...formData, tradeName: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="APLBJ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="00.000.000/0000-00"
                  required
                />
                {errors.cnpj && (
                  <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={formData.stateRegistration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stateRegistration: e.target.value,
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Institucional *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateEmailField(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="contato@associacao.org.br"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    validatePasswordField(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha *
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    });
                    validateConfirmPasswordField(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                text="PRÓXIMO"
                onClick={handleNextStep}
                bgColor="bg-green-800"
                textColor="text-white"
                hoverColor="hover:bg-green-900"
                className="w-full mt-4"
                disabled={loading}
              />

              <p className="text-center text-gray-700 mt-4 text-sm">
                Já possui uma conta?{" "}
                <a href="/login" className="text-green-800 font-bold">
                  Faça login
                </a>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone Fixo *
                </label>
                <input
                  type="text"
                  value={formData.landlinePhone}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value, "landlinePhone")
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(87) 3721-1234"
                  required
                />
                {errors.landlinePhone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.landlinePhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone Celular/WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.mobilePhone}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value, "mobilePhone")
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(87) 9 9999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://www.associacao.org.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="55155-000"
                  required
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      state: e.target.value,
                      city: "",
                    });
                    if (!e.target.value) {
                      setErrors((prev) => ({
                        ...prev,
                        state: "Estado é obrigatório",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, state: "" }));
                    }
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione o estado</option>
                  {estados.map((estado) => (
                    <option key={estado.sigla} value={estado.sigla}>
                      {estado.nome}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (!e.target.value) {
                      setErrors((prev) => ({
                        ...prev,
                        city: "Cidade é obrigatória",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, city: "" }));
                    }
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!formData.state}
                  required
                >
                  <option value="">Selecione a cidade</option>
                  {cidades.map((cidade) => (
                    <option key={cidade.nome} value={cidade.nome}>
                      {cidade.nome}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua/Avenida *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => {
                    setFormData({ ...formData, street: e.target.value });
                    if (!e.target.value) {
                      setErrors((prev) => ({
                        ...prev,
                        street: "Rua é obrigatória",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, street: "" }));
                    }
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Rua das Flores"
                  required
                />
                {errors.street && (
                  <p className="text-red-500 text-xs mt-1">{errors.street}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => {
                      setFormData({ ...formData, number: e.target.value });
                      if (!e.target.value) {
                        setErrors((prev) => ({
                          ...prev,
                          number: "Número é obrigatório",
                        }));
                      } else {
                        setErrors((prev) => ({ ...prev, number: "" }));
                      }
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="123"
                    required
                  />
                  {errors.number && (
                    <p className="text-red-500 text-xs mt-1">{errors.number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) =>
                      setFormData({ ...formData, complement: e.target.value })
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Sala 201"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => {
                    setFormData({ ...formData, neighborhood: e.target.value });
                    if (!e.target.value) {
                      setErrors((prev) => ({
                        ...prev,
                        neighborhood: "Bairro é obrigatório",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, neighborhood: "" }));
                    }
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Centro"
                  required
                />
                {errors.neighborhood && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.neighborhood}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  text="VOLTAR"
                  onClick={handlePrevStep}
                  bgColor="bg-gray-500"
                  textColor="text-white"
                  hoverColor="hover:bg-gray-600"
                  className="w-1/2"
                />
                <Button
                  text="PRÓXIMO"
                  onClick={handleNextStep}
                  bgColor="bg-green-800"
                  textColor="text-white"
                  hoverColor="hover:bg-green-900"
                  className="w-1/2"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Fundação
                </label>
                <input
                  type="date"
                  value={formData.foundationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, foundationDate: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Associados
                </label>
                <input
                  type="number"
                  value={formData.numberOfMembers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numberOfMembers: e.target.value,
                    })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="50"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área de Atuação *
                </label>
                <select
                  value={formData.coverageArea}
                  onChange={(e) => {
                    setFormData({ ...formData, coverageArea: e.target.value });
                    if (!e.target.value) {
                      setErrors((prev) => ({
                        ...prev,
                        coverageArea: "Área de atuação é obrigatória",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, coverageArea: "" }));
                    }
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione a área de atuação</option>
                  <option value="Municipal">Municipal</option>
                  <option value="Regional">Regional</option>
                  <option value="Estadual">Estadual</option>
                </select>
                {errors.coverageArea && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.coverageArea}
                  </p>
                )}
              </div>

              <hr className="my-6" />
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Dados do Presidente
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.presidentName}
                  onChange={(e) => {
                    setFormData({ ...formData, presidentName: e.target.value });
                    if (!e.target.value) {
                      setErrors((prev) => ({
                        ...prev,
                        presidentName: "Nome do presidente é obrigatório",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, presidentName: "" }));
                    }
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="João da Silva"
                  required
                />
                {errors.presidentName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.presidentName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.presidentCpf}
                  onChange={(e) => handlePresidentCPFChange(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="000.000.000-00"
                  required
                />
                {errors.presidentCpf && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.presidentCpf}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.presidentEmail}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      presidentEmail: e.target.value,
                    });
                    validateEmailField(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="presidente@email.com"
                  required
                />
                {errors.presidentEmail && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.presidentEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={formData.presidentPhone}
                  onChange={(e) =>
                    handlePhoneChange(e.target.value, "presidentPhone")
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(87) 9 9999-9999"
                  required
                />
                {errors.presidentPhone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.presidentPhone}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  text="VOLTAR"
                  onClick={handlePrevStep}
                  bgColor="bg-gray-500"
                  textColor="text-white"
                  hoverColor="hover:bg-gray-600"
                  className="w-1/2"
                />
                <Button
                  text={loading ? "CADASTRANDO..." : "CADASTRAR"}
                  onClick={handleSubmit}
                  bgColor="bg-green-800"
                  textColor="text-white"
                  hoverColor="hover:bg-green-900"
                  className="w-1/2"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <Footer className="mt-6" />
        </div>

        {!isMobile && (
          <InfoSidebar
            title={associationSidebarData.title}
            subtitle={associationSidebarData.subtitle}
            items={associationSidebarData.items}
          />
        )}
      </div>
      {/* Wave - Aparece apenas ao scroll */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          showWave ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Wave />
      </div>
    </main>
  );
}
