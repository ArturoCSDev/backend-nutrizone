export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    timestamp?: string;
}
  
export interface ErrorResponse {
    status: 'error';
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
}
  
export interface SuccessResponse<T = any> {
    status: 'success';
    message: string;
    data: T;
    timestamp: string;
}

// Para casos donde necesites metadatos adicionales
export interface ApiResponseWithMeta<T = any> {
    status: 'success' | 'error';
    message: string;
    data?: T;
    meta?: {
      total?: number;
      page?: number;
      limit?: number;
      [key: string]: any;
    };
    timestamp: string;
}