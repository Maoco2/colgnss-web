export interface Calculation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  latitude: number;
  longitude: number;
  networkType: string;
  station1Name: string;
  station1Code: string;
  station2Name?: string;
  station2Code?: string;
  distance1: number;
  distance2?: number;
  trackingTime: number;
  isDualFrequency: boolean;
  method: string;
  observations?: string;
  createdAt: string;
}

export interface CalculationStats {
  total: number;
  today: number;
  avgTime: number;
  byNetwork: { networkType: string; count: number }[];
  byUser: { userId: string; count: number }[];
}
