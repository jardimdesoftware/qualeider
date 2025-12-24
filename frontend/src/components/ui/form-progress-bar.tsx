import { Check } from "lucide-react";

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface FormProgressBarProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function FormProgressBar({
  steps,
  currentStep,
  className = "",
}: FormProgressBarProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Mobile: Compact version */}
      <div className="md:hidden text-center mb-4">
        <p className="text-sm font-medium text-gray-600">
          Passo {currentStep + 1} de {steps.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {steps[currentStep]?.title}
        </p>
      </div>

      {/* Desktop: Full progress bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center relative">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      font-semibold text-sm transition-all duration-300
                      ${
                        isCompleted
                          ? "bg-brand-primary text-white"
                          : isCurrent
                          ? "bg-brand-primary text-white ring-4 ring-brand-primary ring-opacity-20"
                          : "bg-gray-200 text-gray-500"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="absolute top-12 text-center w-32">
                    <p
                      className={`
                        text-xs font-medium transition-colors
                        ${
                          isCurrent
                            ? "text-brand-primary"
                            : isCompleted
                            ? "text-gray-700"
                            : "text-gray-400"
                        }
                      `}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 relative top-[-20px]">
                    <div
                      className={`
                        h-full rounded transition-all duration-300
                        ${
                          index < currentStep
                            ? "bg-brand-primary"
                            : "bg-gray-200"
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress percentage bar (both mobile and desktop) */}
      <div className="mt-4 md:mt-16">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-primary h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          {Math.round(((currentStep + 1) / steps.length) * 100)}% concluído
        </p>
      </div>
    </div>
  );
}
