export interface Session {
  id: string;
  userId: string;
  token: string;
  ip: string;
  userAgent: string;
  device?: string;
  location?: string;
  isActive: boolean;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserVisit {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  referrer?: string;
  page: string;
  duration: number;
  timestamp: string;
}
