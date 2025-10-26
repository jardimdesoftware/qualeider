"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Logo from "@/assets/Logo.png";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import { Eye, EyeOff } from "lucide-react";
import { apiBase } from "@/services/baseApi";
import { useLocationData, useIsMobile } from "@/hooks";
import {
  validateCPF,
  validateCNPJ,
  formatCPF,
  formatCNPJ,
  cleanDocument,
  isValidEmail,
  isNotEmpty,
  isValidPassword,
  passwordsMatch,
} from "@/utils";

export default function CreateAccount() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userCategory: "", // Categoria: Produtor ou Associação
    userType: "", // Tipo de Pessoa: Física ou Jurídica (apenas para Produtor na Tela 2)
    document: "", // CPF ou CNPJ
    state: "",
    city: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  // Hooks customizados
  const isMobile = useIsMobile();
  const { estados, cidades } = useLocationData(formData.state);

  // Funções de validação dinâmica
  const validateName = (name: string) => {
    if (!isNotEmpty(name)) {
      setErrors((prev) => ({ ...prev, name: "Nome é obrigatório" }));
    } else {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const validateEmail = (email: string) => {
    if (!isNotEmpty(email)) {
      setErrors((prev) => ({ ...prev, email: "Email é obrigatório" }));
    } else if (!isValidEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Email inválido" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const validateUserCategory = (userCategory: string) => {
    if (!userCategory) {
      setErrors((prev) => ({
        ...prev,
        userCategory: "Categoria é obrigatória",
      }));
    } else {
      setErrors((prev) => ({ ...prev, userCategory: "" }));
    }
  };

  const validateUserType = (userType: string) => {
    if (formData.userCategory === "Pecuarista" && !userType) {
      setErrors((prev) => ({
        ...prev,
        userType: "Tipo de pessoa é obrigatório",
      }));
    } else {
      setErrors((prev) => ({ ...prev, userType: "" }));
    }
  };

  const validateDocument = (document: string) => {
    if (!isNotEmpty(document)) {
      setErrors((prev) => ({ ...prev, document: "CPF/CNPJ é obrigatório" }));
      return;
    }

    const cleanDoc = cleanDocument(document);

    // Determina se é CPF ou CNPJ baseado na categoria/tipo
    const isCNPJ =
      formData.userCategory === "Associacao" ||
      formData.userType === "Juridica";
    const isCPF = formData.userType === "Fisica";

    if (isCNPJ) {
      // Valida CNPJ
      if (cleanDoc.length !== 14) {
        setErrors((prev) => ({
          ...prev,
          document: "CNPJ deve ter 14 dígitos",
        }));
      } else if (!validateCNPJ(document)) {
        setErrors((prev) => ({ ...prev, document: "CNPJ inválido" }));
      } else {
        setErrors((prev) => ({ ...prev, document: "" }));
      }
    } else if (isCPF) {
      // Valida CPF
      if (cleanDoc.length !== 11) {
        setErrors((prev) => ({
          ...prev,
          document: "CPF deve ter 11 dígitos",
        }));
      } else if (!validateCPF(document)) {
        setErrors((prev) => ({ ...prev, document: "CPF inválido" }));
      } else {
        setErrors((prev) => ({ ...prev, document: "" }));
      }
    } else {
      setErrors((prev) => ({ ...prev, document: "" }));
    }
  };

  const handleDocumentChange = (value: string) => {
    const isCNPJ =
      formData.userCategory === "Associacao" ||
      formData.userType === "Juridica";

    let formattedValue = value;

    if (isCNPJ) {
      formattedValue = formatCNPJ(value);
    } else if (formData.userType === "Fisica") {
      formattedValue = formatCPF(value);
    }

    setFormData({ ...formData, document: formattedValue });
    validateDocument(formattedValue);
  };

  const validateState = (state: string) => {
    if (!state) {
      setErrors((prev) => ({ ...prev, state: "Estado é obrigatório" }));
    } else {
      setErrors((prev) => ({ ...prev, state: "" }));
    }
  };

  const validateCity = (city: string) => {
    if (!city) {
      setErrors((prev) => ({ ...prev, city: "Cidade é obrigatória" }));
    } else {
      setErrors((prev) => ({ ...prev, city: "" }));
    }
  };

  const validatePassword = (password: string) => {
    if (!isNotEmpty(password)) {
      setErrors((prev) => ({ ...prev, password: "Senha é obrigatória" }));
    } else if (!isValidPassword(password, 6)) {
      setErrors((prev) => ({
        ...prev,
        password: "Senha deve ter pelo menos 6 caracteres",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const validateConfirmPassword = (confirmPassword: string) => {
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

  const handleNextStep = () => {
    if (step === 1) {
      validateName(formData.name);
      validateEmail(formData.email);
      validateUserCategory(formData.userCategory);

      if (
        !formData.name ||
        !formData.email ||
        !formData.userCategory ||
        errors.name ||
        errors.email ||
        errors.userCategory
      ) {
        return;
      }

      // Se for Associação, define automaticamente como Pessoa Jurídica
      if (formData.userCategory === "Associacao") {
        setFormData({ ...formData, userType: "Juridica" });
      }

      const verifyEmailAlreadyExists = async () => {
        try {
          const resp = await apiBase.get<{ exists: boolean }>(
            "/users/check-email",
            {
              params: { email: formData.email },
            }
          );
          if (resp.data.exists) {
            setErrors((prev) => ({ ...prev, email: "Email já cadastrado" }));
            return;
          }
          setStep(2);
        } catch {
          setStep(2);
        }
      };
      void verifyEmailAlreadyExists();
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    // Se for Produtor, valida o tipo de pessoa
    if (formData.userCategory === "Pecuarista") {
      validateUserType(formData.userType);
    }

    validateDocument(formData.document);
    validateState(formData.state);
    validateCity(formData.city);
    validatePassword(formData.password);
    validateConfirmPassword(formData.confirmPassword);

    const hasErrors =
      !formData.document ||
      !formData.state ||
      !formData.city ||
      !formData.password ||
      !formData.confirmPassword ||
      errors.document ||
      errors.state ||
      errors.city ||
      errors.password ||
      errors.confirmPassword;

    if (
      formData.userCategory === "Pecuarista" &&
      (!formData.userType || errors.userType)
    ) {
      return;
    }

    if (hasErrors) {
      return;
    }

    setLoading(true);

    // Define userType como "Juridica" se for Associação
    const finalUserType =
      formData.userCategory === "Associacao" ? "Juridica" : formData.userType;

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: "Common",
      userType: formData.userCategory, // Categoria: Pecuarista, Associacao, etc
      userCategory: finalUserType, // Tipo de Pessoa: Fisica ou Juridica
      document: cleanDocument(formData.document), // Remove formatação
      state: formData.state,
      city: formData.city,
    };

    try {
      const response = await apiBase.post("/users", userData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        setShowSuccessPopup(true);
      } else {
        setShowErrorPopup(true);
      }
    } catch {
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
      router.push("/");
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
              Cadastro Realizado!
            </h2>
            <p className="text-gray-700 mb-4">
              Sua conta foi criada com sucesso. Redirecionando para o login...
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
              Ocorreu um erro ao tentar criar sua conta. Tente novamente mais
              tarde.
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {step === 1 ? "Criar Conta" : "Finalizar Cadastro"}
          </h1>

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-gray-700 font-medium">Categoria</label>
                <select
                  value={formData.userCategory}
                  onChange={(e) => {
                    setFormData({ ...formData, userCategory: e.target.value });
                    validateUserCategory(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="Pecuarista">Produtor</option>
                  <option value="Associacao">Associação</option>
                </select>
                {errors.userCategory && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.userCategory}
                  </p>
                )}
              </div>
              {/* TELA 1: Nome, Email, Categoria, Senha */}
              <div>
                <label className="text-gray-700 font-medium">
                  {formData.userCategory === "Associacao"
                    ? "Nome da Associação"
                    : formData.userCategory === "Pecuarista"
                    ? "Seu nome"
                    : "Nome"}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    validateName(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="text-gray-700 font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    validateEmail(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div className="relative">
                <label className="text-gray-700 font-medium">Senha</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    validatePassword(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              <div className="relative">
                <label className="text-gray-700 font-medium">
                  Confirmar Senha
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    });
                    validateConfirmPassword(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
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
                disabled={
                  loading ||
                  !!errors.name ||
                  !!errors.email ||
                  !!errors.userCategory ||
                  !!errors.password ||
                  !!errors.confirmPassword
                }
              />
              <p className="text-center text-gray-700 mt-4 text-sm">
                Já possui uma conta?{" "}
                <a href="/login" className="text-green-700 font-semibold">
                  Faça Login
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TELA 2: Tipo de Pessoa (condicional), CPF/CNPJ, Estado, Cidade */}
              {formData.userCategory === "Pecuarista" && (
                <div>
                  <label className="text-gray-700 font-medium">
                    Tipo de Pessoa
                  </label>
                  <select
                    value={formData.userType}
                    onChange={(e) => {
                      setFormData({ ...formData, userType: e.target.value });
                      validateUserType(e.target.value);
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Fisica">Física</option>
                    <option value="Juridica">Jurídica</option>
                  </select>
                  {errors.userType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.userType}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="text-gray-700 font-medium">
                  {formData.userCategory === "Associacao" ||
                  formData.userType === "Juridica"
                    ? "CNPJ"
                    : formData.userType === "Fisica"
                    ? "CPF"
                    : "CPF/CNPJ"}
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder={
                    formData.userCategory === "Associacao" ||
                    formData.userType === "Juridica"
                      ? "00.000.000/0000-00"
                      : formData.userType === "Fisica"
                      ? "000.000.000-00"
                      : ""
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {errors.document && (
                  <p className="text-red-500 text-sm mt-1">{errors.document}</p>
                )}
              </div>
              <div>
                <label className="text-gray-700 font-medium">Estado</label>
                <select
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      state: e.target.value,
                      city: "",
                    });
                    validateState(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione</option>
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.sigla}>
                      {estado.nome}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>
              <div>
                <label className="text-gray-700 font-medium">Cidade</label>
                <select
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    validateCity(e.target.value);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={!formData.state}
                >
                  <option value="">Selecione</option>
                  {cidades.map((cidade) => (
                    <option key={cidade.id} value={cidade.nome}>
                      {cidade.nome}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>
              <div className="flex space-x-4 mt-4">
                <Button
                  text="VOLTAR"
                  onClick={handlePrevStep}
                  bgColor="bg-gray-600"
                  textColor="text-white"
                  hoverColor="hover:bg-gray-700"
                  className="flex-1"
                />
                <Button
                  text={loading ? "Cadastrando..." : "CADASTRAR"}
                  onClick={handleSubmit}
                  bgColor="bg-green-800"
                  textColor="text-white"
                  hoverColor="hover:bg-green-900"
                  className="flex-1"
                  disabled={
                    loading ||
                    (formData.userCategory === "Pecuarista" &&
                      !!errors.userType) ||
                    !!errors.document ||
                    !!errors.state ||
                    !!errors.city
                  }
                />
              </div>
            </div>
          )}
        </div>
        {/* Seção Direita - Apenas em telas maiores */}
        {!isMobile && (
          <div className="hidden md:flex w-full md:w-1/2 bg-green-background p-16 flex-col justify-between items-center relative">
            <div className="text-center">
              <h1 className="text-2xl text-white mb-4">
                Bem-vindo ao <span className="font-bold">QualeiDer!</span>
              </h1>
              <div className="text-white space-y-2 text-sm">
                <p>
                  Sua ferramenta essencial para o gerenciamento da produção
                  leiteira.
                </p>
                <p>
                  Com o <strong>QualeiDer</strong>, você pode:
                </p>
                <ul className="list-disc list-inside">
                  <li>
                    <strong>Cadastrar e gerenciar</strong> seus animais de forma
                    simples e organizada.
                  </li>
                  <li>
                    <strong>Monitorar a produção diária</strong> de leite com
                    precisão e facilidade.
                  </li>
                  <li>
                    <strong>Acessar gráficos detalhados</strong> para tomar
                    decisões mais inteligentes.
                  </li>
                </ul>
              </div>
            </div>
            <div className="absolute bottom-4 right-4">
              <Image src={Logo} alt="Logo do sistema" className="w-20 h-20" />
            </div>
          </div>
        )}
      </div>
      <Wave />
    </main>
  );
}
