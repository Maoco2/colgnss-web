export interface ReportRequest {
  id: string;
  type: 'users' | 'processings' | 'audit' | 'analytics' | 'subscriptions' | 'payments';
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  progress: number;
  requestedBy: string;
  completedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
