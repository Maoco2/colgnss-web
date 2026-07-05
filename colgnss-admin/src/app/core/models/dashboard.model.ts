export interface DashboardCard {
  id: string;
  title: string;
  value: number;
  unit?: string;
  icon?: string;
  color?: string;
  trend?: number;
  trendLabel?: string;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  period: string;
}

export interface UserStats {
  total: number;
  active: number;
  verified: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byRole: Record<string, number>;
  byCountry: Record<string, number>;
}

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  requestsPerMinute: number;
  activeConnections: number;
  lastRestart: string;
}

export interface ChartDataItem {
  label: string;
  value: number;
  series?: string;
  date?: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ip?: string;
  createdAt: string;
}
