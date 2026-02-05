import { useState, useEffect } from "react";
import { Loader2, MapPin } from "lucide-react";
import { TIMING } from "@/constants/ui";
import { formatCEP, cleanCEP, lookupSimpleAddress, CEPError } from "@/services/cepService";
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
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Only enable the query when we have a full CEP and the user has stopped typing (via effect below or just reliance on validity)
  // Actually useCep checks validity internally, but we might want to control when to start "paying attention" to errors
  const { data: addressData, isLoading, error } = useCep(cep);

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setCep(value);
  }, [value]);

  // Handle successful data fetch
  useEffect(() => {
    if (addressData) {
      setLocalError(null);
      onAddressFound({
        street: addressData.street,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state
      });
    }
  }, [addressData, onAddressFound]);

  // Handle errors
  useEffect(() => {
    if (error) {
       const msg = (error as any).message || "Erro ao buscar CEP.";
       setLocalError(msg);
       onError?.(msg);
    } else {
       // Clear error if loading starts or data resets? 
       // React Query resets error on new fetch start if configured, but let's be safe
    }
  }, [error, onError]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    // Clear local error while typing
    if (localError) setLocalError(null);
    
    onChange?.(formatted);
  };

  const displayError = error ? localError : (propsError || localError);

  // We need to override the displayError logic slightly because prop error is passed as 'error'
  // Renaming prop 'error' to 'propsError' in arguments would be cleaner


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
