export interface AnalyticsDataPoint {
  date: string;
  value: number;
  metric: string;
}

export interface AnalyticsSeries {
  name: string;
  data: AnalyticsDataPoint[];
  color?: string;
}

export interface TopItem {
  rank: number;
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface ConstellationData {
  constellation: string;
  satellites: number;
  visible: number;
  tracked: number;
  health: number;
  avgSnr: number;
}

export interface ProcessingByModule {
  module: string;
  count: number;
  avgDuration: number;
  successRate: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  metric?: string;
  userId?: string;
}
