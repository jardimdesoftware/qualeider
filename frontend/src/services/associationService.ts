import { apiBase } from "./baseApi";
import { AssociationData } from "@/schemas/registration";
import { cleanDocument } from "@/utils/masks";

export const associationService = {
  /**
   * Create a new association
   */
  create: async (data: AssociationData) => {
    const payload = {
      ...data,
      cnpj: cleanDocument(data.cnpj),
      phone: cleanDocument(data.phone),
      userCategory: "Juridica",
    };

    const response = await apiBase.post("/associations", payload);
    return response.data;
  },

  /**
 * Check if email already exists
   */
  checkEmail: async (email: string): Promise<boolean> => {
    const { data } = await apiBase.get<{ exists: boolean }>(
      "/associations/check-email",
      { params: { email } }
    );
    return data.exists;
  },

  /**
   * Check if CNPJ already exists
   */
  checkCnpj: async (cnpj: string): Promise<boolean> => {
    const cleanCnpj = cleanDocument(cnpj);
    const { data } = await apiBase.get<{ exists: boolean }>(
      "/associations/check-cnpj",
      { params: { cnpj: cleanCnpj } }
    );
    return data.exists;
  },

  /**
   * Find association by ID
   */
  findById: async (id: number) => {
    const { data } = await apiBase.get(`/associations/${id}`);
    return data;
  },
};
