export interface PagedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: T[];
}