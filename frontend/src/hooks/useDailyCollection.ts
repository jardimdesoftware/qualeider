import { useState } from "react";

export interface ValidationError {
  field: string;
  message: string;
}

export interface DailyCollectionValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Custom hook for managing daily collection form logic and validation
 */
export function useDailyCollection() {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  /**
   * Validate collection items before submission
   * @param items - Array of collection items with animalId and quantity
   * @returns Validation result with any errors found
   */
  const validateCollectionItems = (
    items: Array<{ animalId: number; quantity: number }>
  ): DailyCollectionValidationResult => {
    const errors: ValidationError[] = [];

    // Check if there are any items
    if (items.length === 0) {
      errors.push({
        field: "items",
        message: "Adicione pelo menos um animal com produção para finalizar a coleta.",
      });
    }

    // Validate each item
    items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push({
          field: `items[${index}].quantity`,
          message: `Animal ${item.animalId}: quantidade deve ser maior que zero`,
        });
      }

      if (!Number.isFinite(item.quantity)) {
        errors.push({
          field: `items[${index}].quantity`,
          message: `Animal ${item.animalId}: quantidade inválida`,
        });
      }
    });

    setValidationErrors(errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Transform production map to collection items, filtering out empty/zero values
   * @param productionMap - Map of animalId to quantity string
   * @returns Array of valid collection items
   */
  const transformProductionMapToItems = (
    productionMap: Record<number, string>
  ): Array<{ animalId: number; quantity: number }> => {
    return Object.entries(productionMap)
      .map(([animalId, val]) => ({
        animalId: Number(animalId),
        quantity: parseFloat(val) || 0,
      }))
      .filter((item) => item.quantity > 0);
  };

  /**
   * Clear all validation errors
   */
  const clearValidationErrors = () => {
    setValidationErrors([]);
  };

  return {
    validationErrors,
    validateCollectionItems,
    transformProductionMapToItems,
    clearValidationErrors,
  };
}
