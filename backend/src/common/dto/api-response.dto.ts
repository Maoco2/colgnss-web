export class ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };

  static ok<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, message };
  }

  static error(message: string, error?: string): ApiResponse<null> {
    return { success: false, message, error };
  }

  static paginated<T>(data: T[], total: number, page: number, limit: number): ApiResponse<T[]> {
    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
