import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { ICON_SIZES } from "@/constants/ui";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordToggle?: boolean;
  registration?: any;
  helperText?: string;
  helperIcon?: React.ReactNode;
}

export default function InputField({
  label,
  error,
  showPasswordToggle,
  type = "text",
  className = "",
  registration,
  helperText,
  helperIcon,
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = showPasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : type;

  const hasIcon = showPasswordToggle || error;

  return (
    <div className="space-y-1">
      <label className="text-brand-primary font-medium text-sm">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          className={`w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? "border-red-500" : ""}
            ${hasIcon ? "pr-10" : ""}
            ${className}`}
          {...registration}
          {...props}
        />
        {error ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle size={ICON_SIZES.XS} />
          </div>
        ) : showPasswordToggle ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={ICON_SIZES.XS} /> : <Eye size={ICON_SIZES.XS} />}
          </button>
        ) : null}
      </div>
      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1 flex items-start gap-1">
          {helperIcon || <span className="text-blue-500">ℹ️</span>}
          <span>{helperText}</span>
        </p>
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={ICON_SIZES.XXS} />
          {error}
        </p>
      )}
    </div>
  );
}
