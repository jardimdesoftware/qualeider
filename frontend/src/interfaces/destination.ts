export interface Destination {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateDestinationDto = Pick<Destination, 'name' | 'description'>;
export type UpdateDestinationDto = Partial<CreateDestinationDto>;
