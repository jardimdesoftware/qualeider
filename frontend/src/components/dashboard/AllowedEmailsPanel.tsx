"use client";

import { useState } from "react";
import { KeyRound, Trash2, Plus } from "lucide-react";
import { InputField, Button } from "@/components/ui";
import {
  useAllowedEmails,
  useCreateAllowedEmail,
  useRemoveAllowedEmail,
} from "@/hooks/queries/useAllowedEmails";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

/**
 * Painel (Admin-only) para liberar login via Google a emails de fora do
 * domínio ifpe.edu.br — quem tem email @ifpe.edu.br já entra direto, sem
 * precisar disso (ver AuthService.loginWithGoogle no backend).
 */
export default function AllowedEmailsPanel() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { data: allowedEmails = [], isLoading } = useAllowedEmails();
  const createMutation = useCreateAllowedEmail();
  const removeMutation = useRemoveAllowedEmail();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    createMutation.mutate(email.trim(), {
      onSuccess: () => setEmail(""),
      onError: (err) => setError(getFriendlyErrorMessage(err)),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound size={18} className="text-brand-primary" />
        <h3 className="font-semibold text-gray-900">
          Emails liberados para login com Google
        </h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Emails @ifpe.edu.br entram automaticamente. Libere aqui um email de fora
        do IFPE para que a pessoa também consiga entrar com Google.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-4"
      >
        <div className="w-full sm:max-w-xs">
          <InputField
            label="Email"
            type="email"
            placeholder="pessoa@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={createMutation.isPending}
            required
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={createMutation.isPending || !email.trim()}
          className="shrink-0"
        >
          <Plus size={16} />
          Liberar email
        </Button>
      </form>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {isLoading && (
        <p className="text-sm text-gray-500">Carregando emails liberados...</p>
      )}

      {!isLoading && allowedEmails.length === 0 && (
        <p className="text-sm text-gray-500">
          Nenhum email externo liberado ainda.
        </p>
      )}

      {!isLoading && allowedEmails.length > 0 && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {allowedEmails.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="text-gray-800">{item.email}</span>
              <button
                type="button"
                onClick={() => removeMutation.mutate(item.id)}
                disabled={removeMutation.isPending}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                aria-label={`Remover liberação de ${item.email}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
