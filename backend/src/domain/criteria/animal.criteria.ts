/**
 * Critérios de filtragem para busca de animais.
 * 
 * @property associationId - Filtrar por ID da associação
 * @property userId - Filtrar por ID do usuário/produtor
 * @property status - Filtrar por status (padrão: 'Active' se não informado)
 * @property includeUser - Se true, traz os dados do usuário/produtor
 */
export interface AnimalCriteria {
  associationId?: number;
  userId?: number;
  status?: 'Active' | 'Inactive';
  includeUser?: boolean;
}
