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

  /**
   * Get list of associates with metrics
   */
  getAssociates: async (page = 1, limit = 10): Promise<{ data: any[], total: number }> => {
    const token = localStorage.getItem("authToken");
    const { data } = await apiBase.get("/associations/metrics/associates", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit }
    });
    return data;
  },

  /**
   * Get regional herd stats
   */
  getHerdStats: async (): Promise<any> => {
    const token = localStorage.getItem("authToken");
    const { data } = await apiBase.get("/associations/metrics/herd", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  getAvailableProducers: async (): Promise<any[]> => {
    const token = localStorage.getItem("authToken");
    const { data } = await apiBase.get("/associations/available-producers", {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  inviteProducer: async (userId: number): Promise<void> => {
    const token = localStorage.getItem("authToken");
    await apiBase.post("/associations/invite", { userId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};
