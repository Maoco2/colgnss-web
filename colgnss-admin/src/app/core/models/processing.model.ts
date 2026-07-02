export interface ProcessingHistory {
  id: string;
  userId: string;
  userName?: string;
  module: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  inputFile?: string;
  outputFile?: string;
  parameters?: Record<string, unknown>;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingStat {
  date: string;
  count: number;
  avgDuration: number;
  successCount: number;
  failCount: number;
}

export interface ProcessingFilters {
  userId?: string;
  module?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
