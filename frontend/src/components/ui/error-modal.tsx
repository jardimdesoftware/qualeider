import { ReactNode } from "react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "success" | "error";
}

export default function ErrorModal({
  isOpen,
  onClose,
  title = "Erro",
  message,
  type = "error",
}: ErrorModalProps) {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full">
        <div className="mb-4 flex justify-center">
          <div className={`w-12 h-12 ${isSuccess ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
            {isSuccess ? (
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
          </div>
        </div>
        <h2 className="text-xl font-bold text-brand-primary mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
