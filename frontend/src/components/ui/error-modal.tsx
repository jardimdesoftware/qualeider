interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "success" | "error" | "info";
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
  const isInfo = type === "info";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="campus-card w-full max-w-sm p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className={`w-12 h-12 ${isSuccess ? 'bg-green-100' : isInfo ? 'bg-blue-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
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
            ) : isInfo ? (
              <svg 
                className="w-6 h-6 text-blue-600"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          className="w-full rounded-full bg-brand-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-primary-hover"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
