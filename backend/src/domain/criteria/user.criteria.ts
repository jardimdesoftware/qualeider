export interface UserCriteria {
  associationId?: number;
  status?: 'Active' | 'Inactive';
  emailContains?: string;
}
