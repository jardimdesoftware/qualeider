import { useState, useEffect, useCallback } from "react";
import { logger } from "@/utils/logger";

/**
 * Custom hook for managing multistep form state
 * 
 * @param totalSteps - Total number of steps in the form
 * @param initialStep - Starting step (default: 0)
 * @returns Object with current step, navigation functions, and step info
 */
export function useMultiStepForm(totalSteps: number, initialStep: number = 0) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return {
    currentStep,
    goToStep,
    nextStep,
    previousStep,
    reset,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps,
  };
}

/**
 * Custom hook for managing form data across multiple steps
 * 
 * @param initialData - Initial form data object
 * @returns Object with form data and update function
 */
export function useFormData<T extends Record<string, any>>(initialData: T) {
  const [formData, setFormData] = useState<T>(initialData);

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    formData,
    updateFormData,
    resetFormData,
    setField,
  };
}

/**
 * Utility to validate a specific step's fields
 * 
 * @param data - Form data object
 * @param requiredFields - Array of required field names for this step
 * @returns True if all required fields are filled
 */
export function validateStepFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): boolean {
  return requiredFields.every((field) => {
    const value = data[field];
    
    // Check if value exists and is not empty
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    
    return true;
  });
}

/**
 * Utility to get missing fields from a step validation
 * 
 * @param data - Form data object
 * @param requiredFields - Array of required field names
 * @returns Array of missing field names
 */
export function getMissingFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): (keyof T)[] {
  return requiredFields.filter((field) => {
    const value = data[field];
    
    if (value === undefined || value === null) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    
    return false;
  });
}

/**
 * Utility to split a schema into step-specific schemas
 * This can be used with Zod for step-by-step validation
 */
export interface StepConfig<T> {
  id: string;
  title: string;
  description?: string;
  fields: (keyof T)[];
  validate?: (data: Partial<T>) => boolean | Promise<boolean>;
}

export function createStepConfig<T>(
  steps: Omit<StepConfig<T>, 'validate'>[]
): StepConfig<T>[] {
  return steps.map((step) => ({
    ...step,
    validate: (data: Partial<T>) => validateStepFields(data, step.fields),
  }));
}

/**
 * Hook to persist form data to localStorage
 * Useful for preventing data loss on page refresh
 */
export function usePersistedFormData<T extends Record<string, any>>(
  key: string,
  initialData: T
) {
  const [formData, setFormData] = useState<T>(initialData);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setFormData(JSON.parse(stored));
        }
      } catch (error) {
        logger.error("Error loading persisted form data", error, { storageKey: key });
      }
    }
  }, [key]);

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...updates };
      
      // Persist to localStorage
      try {
        localStorage.setItem(key, JSON.stringify(newData));
      } catch (error) {
        logger.error("Error persisting form data", error, { storageKey: key });
      }
      
      return newData;
    });
  }, [key]);

  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setFormData(initialData);
    } catch (error) {
      logger.error("Error clearing persisted form data", error, { storageKey: key });
    }
  }, [key, initialData]);

  return {
    formData,
    updateFormData,
    clearPersistedData,
  };
}
