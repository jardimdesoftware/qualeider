"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import { Eye, EyeOff } from "lucide-react";
import { UserService } from "@/services/user.service";
import { UserType, UserCategory } from "@/interfaces/user";
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
import InfoSidebar from "@/components/global/InfoSidebar";
import { producerSidebarData } from "@/constants/sidebarData";
import Footer from "@/components/global/Footer";

export default function CreateProducer() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userType: "",
    document: "",
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

  const validateUserType = (userType: string) => {
    if (!userType) {
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
    const isCNPJ = formData.userType === UserCategory.Juridica;
    const isCPF = formData.userType === UserCategory.Fisica;

    if (isCNPJ) {
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
      if (cleanDoc.length !== 11) {
        setErrors((prev) => ({ ...prev, document: "CPF deve ter 11 dígitos" }));
      } else if (!validateCPF(document)) {
        setErrors((prev) => ({ ...prev, document: "CPF inválido" }));
      } else {
        setErrors((prev) => ({ ...prev, document: "" }));
      }
    }
  };

  const handleDocumentChange = (value: string) => {
    const isCNPJ = formData.userType === UserCategory.Juridica;
    let formattedValue = value;

    if (isCNPJ) {
      formattedValue = formatCNPJ(value);
    } else if (formData.userType === UserCategory.Fisica) {
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

  const handleSubmit = async () => {
    validateName(formData.name);
    validateEmail(formData.email);
    validateUserType(formData.userType);
    validateDocument(formData.document);
    validateState(formData.state);
    validateCity(formData.city);
    validatePassword(formData.password);
    validateConfirmPassword(formData.confirmPassword);

    const hasErrors =
      !formData.name ||
      !formData.email ||
      !formData.userType ||
      !formData.document ||
      !formData.state ||
      !formData.city ||
      !formData.password ||
      !formData.confirmPassword ||
      errors.name ||
      errors.email ||
      errors.userType ||
      errors.document ||
      errors.state ||
      errors.city ||
      errors.password ||
      errors.confirmPassword;

    if (hasErrors) {
      return;
    }

    setLoading(true);

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      userType: UserType.Pecuarista,
      userCategory: formData.userType as UserCategory,
      document: cleanDocument(formData.document),
      state: formData.state,
      city: formData.city,
      associationId: undefined, // Explicitly undefined as this is independent producer creation
    };

    try {
      await UserService.create(userData);
      setShowSuccessPopup(true);
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
    }
  };

  return (
    <main
      className={`flex justify-center items-center min-h-screen p-8 ${
        isMobile ? "bg-green-background" : ""
      }`}
    >
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
            Cadastro de Produtor
          </h1>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="text-gray-700 font-medium">Seu nome</label>
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

            <div>
              <label className="text-gray-700 font-medium">
                Tipo de Pessoa
              </label>
              <select
                value={formData.userType}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    userType: e.target.value,
                    document: "",
                  });
                  validateUserType(e.target.value);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Selecione</option>
                <option value={UserCategory.Fisica}>Física</option>
                <option value={UserCategory.Juridica}>Jurídica</option>
              </select>
              {errors.userType && (
                <p className="text-red-500 text-sm mt-1">{errors.userType}</p>
              )}
            </div>

            <div>
              <label className="text-gray-700 font-medium">
                {formData.userType === UserCategory.Juridica
                  ? "CNPJ"
                  : formData.userType === UserCategory.Fisica
                  ? "CPF"
                  : "CPF/CNPJ"}
              </label>
              <input
                type="text"
                value={formData.document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder={
                  formData.userType === UserCategory.Juridica
                    ? "00.000.000/0000-00"
                    : formData.userType === UserCategory.Fisica
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
                  setFormData({ ...formData, state: e.target.value, city: "" });
                  validateState(e.target.value);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Selecione</option>
                {estados.map((estado) => (
                  <option key={estado.sigla} value={estado.sigla}>
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
                  <option key={cidade.nome} value={cidade.nome}>
                    {cidade.nome}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
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
                  setFormData({ ...formData, confirmPassword: e.target.value });
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
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              text={loading ? "Cadastrando..." : "CADASTRAR"}
              onClick={handleSubmit}
              bgColor="bg-green-800"
              textColor="text-white"
              hoverColor="hover:bg-green-900"
              className="w-full mt-4"
              disabled={loading}
            />
          </div>

          <p className="text-center text-gray-700 mt-6 text-sm">
            Já possui uma conta?{" "}
            <a
              href="/login"
              className="text-green-700 font-semibold hover:underline"
            >
              Faça login
            </a>
          </p>

          <Footer className="mt-6" />
        </div>

        {!isMobile && (
          <InfoSidebar
            title={producerSidebarData.title}
            subtitle={producerSidebarData.subtitle}
            items={producerSidebarData.items}
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
