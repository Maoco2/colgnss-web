export interface ServerMetric {
  id: string;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage: number;
  diskTotal: number;
  networkIn: number;
  networkOut: number;
  requestsPerMinute: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  service: string;
}
