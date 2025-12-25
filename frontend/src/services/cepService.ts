/**
 * CEP Service - ViaCEP API Integration
 * 
 * Documentation: https://viacep.com.br/
 */

import { maskCEP, cleanDocument, isValidCEPFormat } from "@/utils/masks";

export interface CEPAddress {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface CEPError {
  message: string;
  code: 'INVALID_CEP' | 'NOT_FOUND' | 'NETWORK_ERROR' | 'API_ERROR';
}

export const formatCEP = maskCEP;

export const cleanCEP = cleanDocument;

export const isValidCEP = (cep: string): boolean => {
  const cleaned = cleanCEP(cep);
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
};

export const lookupCEP = async (cep: string): Promise<CEPAddress> => {
  const cleanedCEP = cleanCEP(cep);

  if (!isValidCEP(cleanedCEP)) {
    throw {
      message: 'CEP inválido. Deve conter 8 dígitos.',
      code: 'INVALID_CEP',
    } as CEPError;
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cleanedCEP}/json/`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw {
        message: 'Erro ao buscar CEP. Tente novamente.',
        code: 'NETWORK_ERROR',
      } as CEPError;
    }

    const data = await response.json();

    if (data.erro) {
      throw {
        message: 'CEP não encontrado. Verifique e tente novamente.',
        code: 'NOT_FOUND',
      } as CEPError;
    }

    return {
      cep: data.cep || cleanedCEP,
      street: data.logradouro || '',
      complement: data.complemento || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      ibge: data.ibge || '',
      gia: data.gia || '',
      ddd: data.ddd || '',
      siafi: data.siafi || '',
    };
  } catch (error: any) {
    if (error.code) {
      throw error;
    }

    throw {
      message: 'Erro ao buscar CEP. Verifique sua conexão e tente novamente.',
      code: 'API_ERROR',
    } as CEPError;
  }
};

export interface SimpleAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const lookupSimpleAddress = async (cep: string): Promise<SimpleAddress> => {
  const fullAddress = await lookupCEP(cep);
  
  return {
    street: fullAddress.street,
    neighborhood: fullAddress.neighborhood,
    city: fullAddress.city,
    state: fullAddress.state,
  };
};
