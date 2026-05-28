import { useState } from "react";
import { CollectionItem } from "@/schemas/collection";

export interface ValidationError {
  field: string;
  message: string;
}

export interface DailyCollectionValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ConfirmedItemMap {
  [animalId: number]: {
    quantity: number;
    cmtResult?: string | null;
  };
}

/**
 * Custom hook for managing daily collection form logic and validation
 */
export function useDailyCollection() {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  /**
   * Validate collection items before submission
   */
  const validateCollectionItems = (
    items: CollectionItem[]
  ): DailyCollectionValidationResult => {
    const errors: ValidationError[] = [];

    if (items.length === 0) {
      errors.push({
        field: "items",
        message: "Adicione pelo menos uma vaca com produção para finalizar a coleta.",
      });
    }

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
    return { isValid: errors.length === 0, errors };
  };

  /**
   * Transform confirmed item map to array for API submission
   */
  const transformConfirmedItemsToPayload = (
    confirmedItems: ConfirmedItemMap
  ): CollectionItem[] => {
    return Object.entries(confirmedItems)
      .map(([animalId, data]) => ({
        animalId: Number(animalId),
        quantity: data.quantity,
        cmtResult: data.cmtResult ?? null,
      }))
      .filter((item) => item.quantity > 0);
  };

  /**
   * @deprecated use transformConfirmedItemsToPayload
   */
  const transformProductionMapToItems = (
    productionMap: Record<number, string>
  ): CollectionItem[] => {
    return Object.entries(productionMap)
      .map(([animalId, val]) => ({
        animalId: Number(animalId),
        quantity: parseFloat(val) || 0,
        cmtResult: null,
      }))
      .filter((item) => item.quantity > 0);
  };

  const clearValidationErrors = () => {
    setValidationErrors([]);
  };

  return {
    validationErrors,
    validateCollectionItems,
    transformConfirmedItemsToPayload,
    transformProductionMapToItems,
    clearValidationErrors,
  };
}
