import { Check } from "lucide-react";

export interface FormStep {
  id: string;
  title: string;
  description?: string;
}

interface FormProgressBarProps {
  steps: FormStep[];
  currentStep: number;
  className?: string;
}

export default function FormProgressBar({
  steps,
  currentStep,
  className = "",
}: FormProgressBarProps) {
  const totalSteps = steps.length;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop: Full progress with step labels */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                      transition-all duration-300 border-2
                      ${
                        isCompleted
                          ? "bg-brand-primary border-brand-primary text-white"
                          : isCurrent
                          ? "bg-white border-brand-primary text-brand-primary ring-4 ring-brand-primary ring-opacity-20"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step Title */}
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent
                          ? "text-brand-primary"
                          : isCompleted
                          ? "text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-gray-500 mt-0.5 max-w-[120px]">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mb-8">
                    <div
                      className={`h-full transition-all duration-300 ${
                        index < currentStep ? "bg-brand-primary" : "bg-gray-300"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Compact progress bar with step count */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Passo {currentStep + 1} de {totalSteps}
          </span>
          <span className="text-xs text-gray-500">{steps[currentStep].title}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-primary h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Description (Mobile) */}
        {steps[currentStep].description && (
          <p className="text-xs text-gray-500 mt-2">
            {steps[currentStep].description}
          </p>
        )}
      </div>
    </div>
  );
}
