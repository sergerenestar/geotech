export interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  field?: string;
  timestamp: string;
}

export interface ValidationErrorResponse {
  error: string;
  code: 'VALIDATION_ERROR';
  fields: { field: string; message: string }[];
  timestamp: string;
}
