export type PaginatedResult<T, K extends keyof OrderRegistry> = {
  items: T[];
  page: number;
  size: number;
  count: number;
  orderBy: OrderRegistry[K];
  ascending: boolean;
  totalPages: number;
};

export type PageInfo<K extends keyof OrderRegistry> = {
  page: number;
  size: number;
  orderBy: OrderRegistry[K];
  ascending: boolean;
};

export type OrderRegistry = {
  Topic: 'created_at' | 'name' | 'last_accessed_at' | 'level' | 'subject' | 'correct_answers';
};
