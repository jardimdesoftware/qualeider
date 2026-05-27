"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, ShieldCheck, Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import {
  InputField,
  SelectField,
  ErrorModal,
  Button,
} from "@/components/ui";
import { useUser, useUpdateUser } from "@/hooks/queries/useUsers";
import { UserRole, Status } from "@/interfaces/user";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

// ── Schema de validação ──────────────────────────────────────────────────────

const editUserSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  role: z.nativeEnum(UserRole, { message: "Selecione o cargo" }),
  status: z.nativeEnum(Status),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

// ── Opções ───────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: UserRole.VAQUEIRO, label: "Vaqueiro (Funcionário operacional)" },
  { value: UserRole.ADMIN, label: "Admin (Gestor / Co-administrador)" },
];

const STATUS_OPTIONS = [
  { value: Status.Active, label: "Ativo" },
  { value: Status.Inactive, label: "Inativo" },
];

// ── Componente interno (precisa de useSearchParams) ───────────────────────────

function EditUserForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const { data: user, isLoading, isError } = useUser(userId);
  const updateUser = useUpdateUser();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    mode: "onBlur",
  });

  // Pré-preenche o formulário quando o usuário carrega
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    }
  }, [user, reset]);

  const onSubmit = (values: EditUserFormData) => {
    if (!userId) return;

    updateUser.mutate(
      {
        id: userId,
        data: {
          name: values.name,
          email: values.email,
          role: values.role,
          status: values.status,
        },
      },
      {
        onSuccess: () => {
          setModalState({
            isOpen: true,
            type: "success",
            message: "Funcionário atualizado com sucesso!",
          });
        },
        onError: (err: any) => {
          setModalState({
            isOpen: true,
            type: "error",
            message: getFriendlyErrorMessage(err),
          });
        },
      }
    );
  };

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.type === "success") {
      router.push("/manageUsers");
    }
  };

  // ── Estados de carregamento / erro ─────────────────────────────────────────

  if (!userId) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        ID de funcionário não informado.{" "}
        <button
          onClick={() => router.push("/manageUsers")}
          className="text-brand-primary hover:underline"
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
        <Loader2 size={18} className="animate-spin" />
        Carregando dados do funcionário...
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-8 text-center text-red-500 text-sm">
        Não foi possível carregar os dados do funcionário.{" "}
        <button
          onClick={() => router.push("/manageUsers")}
          className="text-brand-primary hover:underline"
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  const isPending = updateUser.isPending;

  // ── Formulário ─────────────────────────────────────────────────────────────

  return (
    <>
      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.type === "success" ? "Sucesso!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />

      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Seção: Dados de Acesso */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <User size={16} className="text-brand-primary" />
                Dados de Acesso
              </h3>
              <div className="space-y-4">
                <InputField
                  label="Nome Completo"
                  disabled={isPending}
                  error={errors.name?.message}
                  {...register("name")}
                />
                <InputField
                  label="E-mail"
                  type="email"
                  helperText="Alterar o e-mail afeta o login do funcionário"
                  disabled={isPending}
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Seção: Cargo e Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-brand-primary" />
                Cargo / Perfil
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Cargo na Fazenda"
                  disabled={isPending}
                  error={errors.role?.message}
                  {...register("role")}
                  options={ROLE_OPTIONS}
                />
                <SelectField
                  label="Status da Conta"
                  disabled={isPending}
                  error={errors.status?.message}
                  {...register("status")}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/manageUsers")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isPending || !isDirty}
              >
                {isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Página principal com Suspense (exigido pelo useSearchParams) ──────────────

export default function EditUser() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Editar Funcionário"
        subtitle="Atualize as informações do membro da equipe"
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
            <Loader2 size={18} className="animate-spin" />
            Carregando...
          </div>
        }
      >
        <EditUserForm />
      </Suspense>
    </DashboardLayout>
  );
}
