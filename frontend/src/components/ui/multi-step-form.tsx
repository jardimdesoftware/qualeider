import { ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FormProgressBar, { FormStep } from "./form-progress-bar";
import Button from "./button";

export interface MultiStepFormProps {
  steps: FormStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  children: ReactNode;
  isSubmitting?: boolean;
  canGoNext?: boolean;
  canGoBack?: boolean;
  hideBackOnFirstStep?: boolean;
  submitButtonText?: string;
  nextButtonText?: string;
  backButtonText?: string;
  showProgress?: boolean;
}

export default function MultiStepForm({
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  children,
  isSubmitting = false,
  canGoNext = true,
  canGoBack = true,
  hideBackOnFirstStep = true,
  submitButtonText = "FINALIZAR",
  nextButtonText = "PRÓXIMO",
  backButtonText = "VOLTAR",
  showProgress = true,
}: MultiStepFormProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep && canGoNext) {
      onStepChange(currentStep + 1);
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (!isFirstStep && canGoBack) {
      onStepChange(currentStep - 1);
      // Scroll to top when changing steps
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLastStep) {
      onSubmit();
    } else {
      handleNext();
    }
  };

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      {showProgress && (
        <FormProgressBar
          steps={steps}
          currentStep={currentStep}
          className="mb-8"
        />
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Step Content */}
        <div className="min-h-[300px]">
          {children}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-row items-center gap-3 pt-4 border-t border-gray-200">
          {/* Back Button */}
          {(!isFirstStep || !hideBackOnFirstStep) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={!canGoBack || isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {backButtonText}
            </Button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Next/Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={!canGoNext || isSubmitting}
            className="whitespace-nowrap w-full sm:w-auto"
          >
            {isSubmitting ? (
              <span>PROCESSANDO...</span>
            ) : isLastStep ? (
              submitButtonText
            ) : (
              <span className="flex items-center gap-1">
                {nextButtonText}
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
