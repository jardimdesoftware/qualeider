export interface DailyCollectionCriteria {
  associationId?: number;
  userId?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
