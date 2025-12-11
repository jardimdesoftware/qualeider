"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  BrandHeader,
  ContentCard,
  InputField,
  SelectField,
  Button,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { UserService } from "@/services/user.service";
import { UserType, UserCategory } from "@/interfaces/user";
import { useLocationData } from "@/hooks";
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
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { estados, cidades } = useLocationData(formData.state);

  const validate = {
    name: (value: string) => {
      if (!isNotEmpty(value)) {
        setErrors((prev) => ({ ...prev, name: "Nome é obrigatório" }));
        return false;
      }
      setErrors((prev) => ({ ...prev, name: "" }));
      return true;
    },

    email: (value: string) => {
      if (!isNotEmpty(value)) {
        setErrors((prev) => ({ ...prev, email: "Email é obrigatório" }));
        return false;
      } else if (!isValidEmail(value)) {
        setErrors((prev) => ({ ...prev, email: "Email inválido" }));
        return false;
      }
      setErrors((prev) => ({ ...prev, email: "" }));
      return true;
    },

    userType: (value: string) => {
      if (!value) {
        setErrors((prev) => ({
          ...prev,
          userType: "Tipo de pessoa é obrigatório",
        }));
        return false;
      }
      setErrors((prev) => ({ ...prev, userType: "" }));
      return true;
    },

    document: (value: string) => {
      if (!isNotEmpty(value)) {
        setErrors((prev) => ({
          ...prev,
          document: "CPF/CNPJ é obrigatório",
        }));
        return false;
      }

      const cleanDoc = cleanDocument(value);
      const isCNPJ = formData.userType === UserCategory.Juridica;

      if (isCNPJ) {
        if (cleanDoc.length !== 14) {
          setErrors((prev) => ({
            ...prev,
            document: "CNPJ deve ter 14 dígitos",
          }));
          return false;
        } else if (!validateCNPJ(value)) {
          setErrors((prev) => ({ ...prev, document: "CNPJ inválido" }));
          return false;
        }
      } else {
        if (cleanDoc.length !== 11) {
          setErrors((prev) => ({
            ...prev,
            document: "CPF deve ter 11 dígitos",
          }));
          return false;
        } else if (!validateCPF(value)) {
          setErrors((prev) => ({ ...prev, document: "CPF inválido" }));
          return false;
        }
      }

      setErrors((prev) => ({ ...prev, document: "" }));
      return true;
    },

    password: (value: string) => {
      if (!isNotEmpty(value)) {
        setErrors((prev) => ({ ...prev, password: "Senha é obrigatória" }));
        return false;
      } else if (!isValidPassword(value, 6)) {
        setErrors((prev) => ({
          ...prev,
          password: "Senha deve ter pelo menos 6 caracteres",
        }));
        return false;
      }
      setErrors((prev) => ({ ...prev, password: "" }));
      return true;
    },

    confirmPassword: (value: string) => {
      if (!isNotEmpty(value)) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Confirme a senha",
        }));
        return false;
      } else if (!passwordsMatch(formData.password, value)) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "As senhas não coincidem",
        }));
        return false;
      }
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      return true;
    },
  };

  const handleDocumentChange = (value: string) => {
    const isCNPJ = formData.userType === UserCategory.Juridica;
    const formatted = isCNPJ ? formatCNPJ(value) : formatCPF(value);
    setFormData({ ...formData, document: formatted });
    if (errors.document) validate.document(formatted);
  };

  const handleSubmit = async () => {
    const isValid =
      validate.name(formData.name) &&
      validate.email(formData.email) &&
      validate.userType(formData.userType) &&
      validate.document(formData.document) &&
      formData.state &&
      formData.city &&
      validate.password(formData.password) &&
      validate.confirmPassword(formData.confirmPassword);

    if (!isValid) return;

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
      associationId: undefined,
    };

    try {
      await UserService.create(userData);
      setShowSuccessModal(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Erro ao criar conta. Tente novamente."
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
        message="Conta criada com sucesso! Redirecionando para o login..."
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
            className="inline-flex items-center text-brand-primary hover:text-brand-primary-hover font-semibold text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Voltar
          </Link>

          <h2 className="text-brand-primary text-2xl font-bold text-center mb-6">
            Cadastro de Produtor
          </h2>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <InputField
              label="Nome Completo"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) validate.name(e.target.value);
              }}
              onBlur={(e) => validate.name(e.target.value)}
              error={errors.name}
              placeholder="João Silva"
              disabled={loading}
            />

            <InputField
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) validate.email(e.target.value);
              }}
              onBlur={(e) => validate.email(e.target.value)}
              error={errors.email}
              placeholder="seu@email.com"
              disabled={loading}
            />

            <SelectField
              label="Tipo de Pessoa"
              value={formData.userType}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  userType: e.target.value,
                  document: "",
                });
                validate.userType(e.target.value);
              }}
              error={errors.userType}
              options={[
                { value: UserCategory.Fisica, label: "Física" },
                { value: UserCategory.Juridica, label: "Jurídica" },
              ]}
              placeholder="Selecione"
              disabled={loading}
            />

            {formData.userType && (
              <InputField
                label={
                  formData.userType === UserCategory.Juridica ? "CNPJ" : "CPF"
                }
                type="text"
                value={formData.document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                onBlur={(e) => validate.document(e.target.value)}
                error={errors.document}
                placeholder={
                  formData.userType === UserCategory.Juridica
                    ? "00.000.000/0000-00"
                    : "000.000.000-00"
                }
                disabled={loading}
              />
            )}

            <SelectField
              label="Estado"
              value={formData.state}
              onChange={(e) => {
                setFormData({ ...formData, state: e.target.value, city: "" });
              }}
              options={estados.map((e) => ({ value: e.sigla, label: e.nome }))}
              placeholder="Selecione o estado"
              disabled={loading}
            />

            <SelectField
              label="Cidade"
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
              }}
              options={cidades.map((c) => ({
                value: c.nome,
                label: c.nome,
              }))}
              placeholder="Selecione a cidade"
              disabled={loading || !formData.state}
            />

            <InputField
              label="Senha"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) validate.password(e.target.value);
              }}
              onBlur={(e) => validate.password(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
              showPasswordToggle
              disabled={loading}
            />

            <InputField
              label="Confirmar Senha"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword)
                  validate.confirmPassword(e.target.value);
              }}
              onBlur={(e) => validate.confirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="••••••••"
              showPasswordToggle
              disabled={loading}
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            loading={loading}
            disabled={Object.values(errors).some((e) => e !== "")}
            className="mt-6"
          >
            CADASTRAR
          </Button>

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
