export interface Subscription {
  id: string;
  userId: string;
  userName?: string;
  plan: string;
  status: 'active' | 'canceled' | 'expired' | 'trialing';
  startDate: string;
  endDate?: string;
  canceledAt?: string;
  autoRenew: boolean;
  price: number;
  currency: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  paidAt?: string;
  createdAt: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  canceled: number;
  expired: number;
  monthlyRevenue: number;
  annualRevenue: number;
  byPlan: Record<string, number>;
  revenueByMonth: Record<string, number>;
}
