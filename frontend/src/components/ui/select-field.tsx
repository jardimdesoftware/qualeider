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
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-[0.03em] text-brand-muted">
        {label}
      </label>
      <select
        className={`h-11 w-full rounded border border-[#cfcfcf] bg-white px-3 py-2 text-sm text-gray-900 shadow-sm
          focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary
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
