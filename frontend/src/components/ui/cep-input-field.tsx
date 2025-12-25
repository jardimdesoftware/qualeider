import { useState, useEffect } from "react";
import { Loader2, MapPin } from "lucide-react";
import { formatCEP, cleanCEP, lookupSimpleAddress, CEPError } from "@/services/cepService";

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
  error,
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
  const [cep, setCep] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setCep(value);
  }, [value]);

  const fetchAddress = async (cepValue: string) => {
    const cleaned = cleanCEP(cepValue);
    if (cleaned.length !== 8) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      const address = await lookupSimpleAddress(cepValue);
      onAddressFound(address);
    } catch (err) {
      const cepError = err as CEPError;
      const errorMsg = cepError.message || "Erro ao buscar CEP. Tente novamente.";
      setLocalError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    onChange?.(formatted);

    // Auto-fetch when CEP is complete (8 digits)
    const cleaned = cleanCEP(formatted);
    if (cleaned.length === 8) {
      // Debounce by 500ms
      const timer = setTimeout(() => {
        fetchAddress(formatted);
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  const displayError = error || localError;

  return (
    <div className="space-y-1">
      <label className="text-brand-primary font-medium text-sm">
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
          className={`w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
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
      
      {displayError && <p className="text-red-500 text-xs mt-1">{displayError}</p>}
    </div>
  );
}
