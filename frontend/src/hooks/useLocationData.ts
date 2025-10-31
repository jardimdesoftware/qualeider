/**
 * Hook customizado para gerenciar estados e cidades
 */

import { useState, useEffect } from "react";
import { Estado, Cidade } from "@/interfaces/location";
import { fetchEstados, fetchCidades } from "@/services/location.service";
import { sortByNamePtBr } from "@/constants/user-options";

export const useLocationData = (selectedState?: string) => {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);

  // Busca estados ao montar o componente
  useEffect(() => {
    const loadEstados = async () => {
      const data = await fetchEstados();
      setEstados(sortByNamePtBr(data));
    };
    loadEstados();
  }, []);

  // Busca cidades quando o estado é selecionado
  useEffect(() => {
    const loadCidades = async () => {
      if (selectedState) {
        const data = await fetchCidades(selectedState);
        setCidades(sortByNamePtBr(data));
      } else {
        setCidades([]);
      }
    };
    loadCidades();
  }, [selectedState]);

  return { estados, cidades };
};
