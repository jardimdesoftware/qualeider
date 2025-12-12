import { SelectHTMLAttributes } from "react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder?: string;
}

export default function SelectField({
  label,
  error,
  options,
  placeholder = "Selecione uma opção",
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-brand-primary font-medium text-sm">{label}</label>
      <select
        className={`w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? "border-red-500" : ""}
          ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
