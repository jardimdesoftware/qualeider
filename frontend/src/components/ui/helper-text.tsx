import { Info } from "lucide-react";
import { useState } from "react";

interface HelperTextProps {
  text: string;
  variant?: 'tooltip' | 'inline';
  icon?: React.ReactNode;
  className?: string;
}

export default function HelperText({ 
  text, 
  variant = 'inline', 
  icon,
  className = ""
}: HelperTextProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  if (variant === 'inline') {
    return (
      <p className={`text-gray-500 text-xs mt-1 flex items-start gap-1 ${className}`}>
        {icon || <span className="text-blue-500 mt-0.5">ℹ️</span>}
        <span>{text}</span>
      </p>
    );
  }

  // Tooltip variant
  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600 transition-colors"
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onClick={() => setIsTooltipVisible(!isTooltipVisible)}
        aria-label="Mais informações"
      >
        {icon || <Info className="w-4 h-4" />}
      </button>

      {isTooltipVisible && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 
            bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg
            after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2
            after:border-4 after:border-transparent after:border-t-gray-900"
        >
          {text}
        </div>
      )}
    </div>
  );
}
