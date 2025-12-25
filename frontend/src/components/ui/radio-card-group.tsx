import { Check } from "lucide-react";

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioCardGroupProps {
  label: string;
  name: string;
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  columns?: 1 | 2 | 3;
}

export default function RadioCardGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  columns = 2,
}: RadioCardGroupProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
  };

  return (
    <div className="space-y-2">
      <label className="text-brand-primary font-medium text-sm block">
        {label}
      </label>

      <div className={`grid ${gridCols[columns]} gap-3`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300
                text-left transform hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                ${
                  isSelected
                    ? "border-brand-primary bg-green-50 shadow-md"
                    : "border-gray-300 bg-white hover:border-brand-primary hover:shadow-sm"
                }
              `}
            >
              {/* Hidden radio input for accessibility */}
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
                disabled={disabled}
              />

              <div className="flex items-start gap-3">
                {/* Icon */}
                {option.icon && (
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${
                        isSelected
                          ? "bg-brand-primary text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {option.icon}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 mb-1">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-sm text-gray-600">
                      {option.description}
                    </div>
                  )}
                </div>

                {/* Check icon */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-2 flex items-start gap-1">
          <span className="text-blue-500">ℹ️</span>
          {helperText}
        </p>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
