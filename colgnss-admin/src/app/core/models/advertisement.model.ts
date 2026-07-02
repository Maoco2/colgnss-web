export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  placement: string;
  type: string;
  status: 'active' | 'inactive' | 'expired';
  startDate: string;
  endDate: string;
  maxClicks?: number;
  maxImpressions?: number;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdClick {
  id: string;
  adId: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  clickedAt: string;
}

export interface AdStats {
  totalAds: number;
  activeAds: number;
  totalClicks: number;
  totalImpressions: number;
  clickThroughRate: number;
  clicksByDay: Record<string, number>;
  impressionsByDay: Record<string, number>;
}
