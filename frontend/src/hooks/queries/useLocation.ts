import { useQuery } from "@tanstack/react-query";
import { ibgeService } from "@/services/ibgeService";
import { lookupCEP, cleanCEP, isValidCEP } from "@/services/cepService";
import { STALE_TIMES } from "@/constants/query";

export const LOCATION_KEYS = {
  all: ["location"] as const,
  states: () => [...LOCATION_KEYS.all, "states"] as const,
  cities: (uf: string) => [...LOCATION_KEYS.all, "cities", uf] as const,
  cep: (cep: string) => [...LOCATION_KEYS.all, "cep", cep] as const,
};

export function useStates() {
  return useQuery({
    queryKey: LOCATION_KEYS.states(),
    queryFn: () => ibgeService.getStates(),
    staleTime: STALE_TIMES.INFINITE,
  });
}

export function useCities(ufSigla: string | undefined | null) {
  return useQuery({
    queryKey: LOCATION_KEYS.cities(ufSigla!),
    queryFn: () => ibgeService.getCities(ufSigla!),
    enabled: !!ufSigla,
    staleTime: STALE_TIMES.INFINITE,
  });
}

export function useCep(cep: string) {
  const cleanedCep = cleanCEP(cep);
  const isValid = isValidCEP(cleanedCep);

  return useQuery({
    queryKey: LOCATION_KEYS.cep(cleanedCep),
    queryFn: () => lookupCEP(cleanedCep),
    enabled: isValid,
    staleTime: STALE_TIMES.VERY_LONG,
    retry: 1,
  });
}
