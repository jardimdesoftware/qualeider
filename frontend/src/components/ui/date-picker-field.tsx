import { InputHTMLAttributes } from "react";
import { Calendar } from "lucide-react";

interface DatePickerFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  maxDate?: Date;
  minDate?: Date;
}

export default function DatePickerField({
  label,
  error,
  helperText,
  maxDate,
  minDate,
  className = "",
  ...props
}: DatePickerFieldProps) {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const maxDateStr = maxDate ? formatDateForInput(maxDate) : undefined;
  const minDateStr = minDate ? formatDateForInput(minDate) : undefined;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-[0.03em] text-brand-muted">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="date"
          max={maxDateStr}
          min={minDateStr}
          className={`h-11 w-full rounded border border-[#cfcfcf] bg-white px-3 py-2 text-sm text-gray-900 shadow-sm
            focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary
            disabled:bg-gray-100 disabled:cursor-not-allowed
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            ${error ? "border-red-500" : ""}
            ${className}`}
          {...props}
        />
        <Calendar 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" 
          aria-hidden="true"
        />
      </div>

      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1 flex items-start gap-1">
          <span className="text-blue-500">ℹ️</span>
          {helperText}
        </p>
      )}
      
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
