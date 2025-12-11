import { Estado, Cidade } from "@/interfaces/location";
import { sortByNamePtBr } from "@/utils/sorters";

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/estados";

export const ibgeService = {
  getStates: async (): Promise<Estado[]> => {
    const response = await fetch(IBGE_BASE_URL);
    const data = await response.json();
    return sortByNamePtBr(data);
  },

  getCities: async (ufSigla: string): Promise<Cidade[]> => {
    if (!ufSigla) return [];
    const response = await fetch(`${IBGE_BASE_URL}/${ufSigla}/municipios`);
    const data = await response.json();
    return sortByNamePtBr(data);
  },
};
