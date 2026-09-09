import { useState, useEffect, useRef } from "react";
import { Loader2, MapPin } from "lucide-react";
import { formatCEP } from "@/services/cepService";
import { useCep } from "@/hooks/queries/useLocation";

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CEPInputFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  onAddressFound: (address: AddressData) => void;
  onError?: (error: string) => void;
  onChange?: (value: string) => void;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  name?: string;
  id?: string;
}

export default function CEPInputField({
  label = "CEP",
  error: propsError,
  helperText,
  onAddressFound,
  onError,
  onChange,
  value = "",
  className = "",
  disabled,
  placeholder,
  name,
  id,
}: CEPInputFieldProps) {
  /* 
    Refactored to use React Query's useCep hook.
    This simplifies state management and adds caching.
  */
  const [cep, setCep] = useState(value);

  const { data: addressData, isLoading, error } = useCep(cep);

  const [localError, setLocalError] = useState<string | null>(null);

  // Usar ref para o callback evita que o useEffect dispare toda vez que o
  // componente pai re-renderiza (a função mudaria de referência).
  // Sincronizado num effect sem deps (roda apos cada render, mesma ordem
  // relativa aos effects abaixo) em vez de atribuir direto no corpo do
  // render, que a regra react-hooks/refs proíbe.
  const onAddressFoundRef = useRef(onAddressFound);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onAddressFoundRef.current = onAddressFound;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza estado interno editavel com a prop externa `value`
    setCep(value);
  }, [value]);

  // Handle successful data fetch — ref garante estabilidade nas deps
  useEffect(() => {
    if (addressData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reage a resultado assincrono da query e chama callback externo
      setLocalError(null);
      onAddressFoundRef.current({
        street: addressData.street,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      });
    }
  }, [addressData]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const msg = (error as any).message || "Erro ao buscar CEP.";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reage a erro assincrono da query e chama callback externo
      setLocalError(msg);
      onErrorRef.current?.(msg);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    // Clear local error while typing
    if (localError) setLocalError(null);

    onChange?.(formatted);
  };

  const displayError = error ? localError : propsError || localError;

  // We need to override the displayError logic slightly because prop error is passed as 'error'
  // Renaming prop 'error' to 'propsError' in arguments would be cleaner

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-[0.03em] text-brand-muted">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          placeholder={placeholder || "00000-000"}
          maxLength={9}
          value={cep}
          onChange={handleChange}
          disabled={disabled}
          name={name}
          id={id}
          className={`h-11 w-full rounded border border-[#cfcfcf] bg-white px-3 py-2 text-sm text-gray-900 shadow-sm
            focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary
            disabled:bg-gray-100 disabled:cursor-not-allowed
            pr-10
            ${displayError ? "border-red-500" : ""}
            ${className}`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
          ) : (
            <MapPin className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {helperText && !displayError && (
        <p className="text-gray-500 text-xs mt-1 flex items-start gap-1">
          <span className="text-blue-500">ℹ️</span>
          {helperText}
        </p>
      )}

      {displayError && (
        <p className="text-red-500 text-xs mt-1">{displayError}</p>
      )}
    </div>
  );
}
