import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthCriteria {
  label: string;
  shortLabel: string;
  met: boolean;
}

export default function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
  const criteria: StrengthCriteria[] = [
    {
      label: "Mínimo 8 caracteres",
      shortLabel: "8+ chars",
      met: password.length >= 8,
    },
    {
      label: "Contém maiúscula e minúscula",
      shortLabel: "A-a",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      label: "Contém número",
      shortLabel: "0-9",
      met: /[0-9]/.test(password),
    },
    {
      label: "Contém caractere especial (@$!%*?&)",
      shortLabel: "@$!%*?&",
      met: /[@$!%*?&]/.test(password),
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const totalCount = criteria.length;

  const getStrength = (): {
    level: "weak" | "medium" | "strong";
    label: string;
    color: string;
    barColor: string;
  } => {
    if (metCount === 0 || password.length === 0) {
      return {
        level: "weak",
        label: "Muito Fraca",
        color: "text-gray-400",
        barColor: "bg-gray-300",
      };
    }
    if (metCount <= 2) {
      return {
        level: "weak",
        label: "Fraca",
        color: "text-red-600",
        barColor: "bg-red-500",
      };
    }
    if (metCount === 3) {
      return {
        level: "medium",
        label: "Média",
        color: "text-yellow-600",
        barColor: "bg-yellow-500",
      };
    }
    return {
      level: "strong",
      label: "Forte",
      color: "text-green-600",
      barColor: "bg-green-500",
    };
  };

  const strength = getStrength();
  const percentage = (metCount / totalCount) * 100;

  if (password.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">
            Força da senha
          </span>
          <span className={`text-xs font-semibold ${strength.color}`}>
            {strength.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Criteria - Compact Inline */}
      <div className="flex flex-wrap items-center gap-2">
        {criteria.map((criterion, index) => (
          <div
            key={index}
            className={`flex items-center gap-1 text-xs transition-colors ${
              criterion.met ? "text-green-600" : "text-gray-400"
            }`}
          >
            {criterion.met ? (
              <Check className="w-3 h-3 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 flex-shrink-0" />
            )}
            <span>{criterion.shortLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
