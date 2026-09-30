export enum ActivityEventType {
  LOGIN = "LOGIN",
  DAILY_COLLECTION_CREATED = "DAILY_COLLECTION_CREATED",
  DAILY_COLLECTION_UPDATED = "DAILY_COLLECTION_UPDATED",
  ANIMAL_CREATED = "ANIMAL_CREATED",
  ANIMAL_UPDATED = "ANIMAL_UPDATED",
}

export interface ActivityLog {
  id: number;
  userId: number;
  eventType: ActivityEventType;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityLogQuery {
  userId: number;
  page?: number;
  limit?: number;
}

export interface PaginatedActivityLogs {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
