import { apiBase } from "./baseApi";
import { CreateAssociationDto, Association } from "@/interfaces/association";

class AssociationService {
  private static readonly RESOURCE = "/associations";

  async create(data: CreateAssociationDto): Promise<Association> {
    const response = await apiBase.post(AssociationService.RESOURCE, data);
    // Assuming backend returns { statusCode, message, data: Association } for create
    return response.data.data;
  }

  async checkEmail(email: string): Promise<boolean> {
    const { data } = await apiBase.get<{ exists: boolean }>(
      `${AssociationService.RESOURCE}/check-email`,
      { params: { email } }
    );
    return data.exists;
  }

  async checkCnpj(cnpj: string): Promise<boolean> {
    const { data } = await apiBase.get<{ exists: boolean }>(
      `${AssociationService.RESOURCE}/check-cnpj`,
      { params: { cnpj } }
    );
    return data.exists;
  }

  async findById(id: number): Promise<Association> {
    const { data } = await apiBase.get<Association>(
      `${AssociationService.RESOURCE}/${id}`
    );
    return data;
  }
}

export const associationService = new AssociationService();

// Legacy export for compatibility
export const AssociationServiceLegacy = {
  create: associationService.create.bind(associationService),
  checkEmail: associationService.checkEmail.bind(associationService),
  checkCnpj: associationService.checkCnpj.bind(associationService),
  findById: associationService.findById.bind(associationService),
};

export { AssociationServiceLegacy as AssociationService };
