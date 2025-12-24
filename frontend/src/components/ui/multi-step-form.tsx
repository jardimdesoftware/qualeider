import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FormProgressBar, { Step } from "./form-progress-bar";
import Button from "./button";

interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit?: () => void;
  children: ReactNode;
  isSubmitting?: boolean;
  canGoNext?: boolean;
  canGoBack?: boolean;
  showProgress?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  submitButtonText?: string;
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
  showProgress = true,
  nextButtonText = "Próximo",
  backButtonText = "Voltar",
  submitButtonText = "Finalizar",
}: MultiStepFormProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep && canGoNext) {
      onStepChange(currentStep + 1);
    } else if (isLastStep && onSubmit) {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (!isFirstStep && canGoBack) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      {showProgress && (
        <FormProgressBar
          steps={steps}
          currentStep={currentStep}
          className="mb-8"
        />
      )}

      {/* Form Content */}
      <div className="mb-6">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Back Button */}
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={!canGoBack || isSubmitting}
            className="order-2 sm:order-1"
            fullWidth
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {backButtonText}
          </Button>
        )}

        {/* Next/Submit Button */}
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={!canGoNext || isSubmitting}
          className="order-1 sm:order-2"
          fullWidth
        >
          {isSubmitting ? (
            "Processando..."
          ) : isLastStep ? (
            submitButtonText
          ) : (
            <>
              {nextButtonText}
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Step indicator for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Passo {currentStep + 1} de {steps.length}: {steps[currentStep]?.title}
      </div>
    </div>
  );
}
