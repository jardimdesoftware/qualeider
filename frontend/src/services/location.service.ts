import { Estado, Cidade } from "@/interfaces/location";

const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

/**
 * Busca todos os estados brasileiros
 * @returns Lista de estados ou array vazio em caso de erro
 */
export const fetchEstados = async (): Promise<Estado[]> => {
  try {
    const response = await fetch(`${IBGE_BASE_URL}/estados`);
    const data = await response.json();
    return data;
  } catch {
    return [];
  }
};

/**
 * Busca cidades de um estado específico
 * @param stateCode - Sigla do estado (ex: "PE", "SP")
 * @returns Lista de cidades ou array vazio em caso de erro
 */
export const fetchCidades = async (stateCode: string): Promise<Cidade[]> => {
  if (!stateCode) return [];

  try {
    const response = await fetch(
      `${IBGE_BASE_URL}/estados/${stateCode}/municipios`
    );
    const data = await response.json();
    return data;
  } catch {
    return [];
  }
};
