import { ReactNode } from "react";
import Button from "./button";

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "secondary" | "outline";
}

/**
 * Componente de modal reutilizável para confirmações.
 * Uso típico: confirmação de exclusão, ações destrutivas, etc.
 */
export function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full">
        <h2 className="text-xl font-bold text-[#1e3a29] mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" fullWidth>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant}
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
