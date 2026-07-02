export interface ApiKey {
  id: string;
  userId: string;
  userName?: string;
  name: string;
  key: string;
  permissions: string[];
  allowedIps?: string[];
  rateLimit: number;
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUsageLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip: string;
  userAgent?: string;
  responseTime: number;
  timestamp: string;
}
