/**
 * Critérios de filtragem para busca de usuários.
 * 
 * @property associationId - Filtrar por ID da associação
 * @property status - Filtrar por status (padrão: 'Active' se não informado)
 * @property emailContains - Filtrar por email que contenha o texto
 * @property includeAnimals - Se true, traz os animais do usuário
 * @property includeAssociation - Se true, traz os dados da associação
 */
export interface UserCriteria {
  associationId?: number;
  status?: 'Active' | 'Inactive';
  emailContains?: string;
  includeAnimals?: boolean;
  includeAssociation?: boolean;
}
