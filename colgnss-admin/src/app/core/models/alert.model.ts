export interface AlertConfig {
  id: string;
  name: string;
  description?: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'changed';
  threshold: number;
  duration: number;
  channels: string[];
  cooldown: number;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertEvent {
  id: string;
  configId: string;
  configName?: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'firing' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  triggeredAt: string;
}
