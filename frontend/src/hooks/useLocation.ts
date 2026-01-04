import { useState, useEffect } from "react";
import { ibgeService } from "@/services/ibgeService";
import { logger } from "@/utils/logger";
import { Estado, Cidade } from "@/interfaces/location";

/**
 * Custom hook to manage Brazilian states and cities data from IBGE
 * @param selectedState - UF sigla (e.g., "SP", "RJ") to fetch cities for
 * @returns Object containing states, cities, and loading state
 */
export function useLocation(selectedState?: string) {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Fetch states on mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        const data = await ibgeService.getStates();
        setEstados(data);
      } catch (error) {
        logger.error("Erro ao buscar estados", error);
      }
    };
    loadStates();
  }, []);

  // Fetch cities when selectedState changes
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedState) {
        setCidades([]);
        return;
      }

      setIsLoadingCities(true);
      try {
        const data = await ibgeService.getCities(selectedState);
        setCidades(data);
      } catch (error) {
        logger.error("Erro ao buscar cidades", error, { uf: selectedState });
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadCities();
  }, [selectedState]);

  return { estados, cidades, isLoadingCities };
}
