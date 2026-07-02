export interface ReceiverStat {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: string;
  frequency: string;
  channels: number;
  userCount: number;
  processingCount: number;
  successRate: number;
  isActive: boolean;
}

export interface AntennaStat {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: string;
  gain: number;
  polarization: string;
  userCount: number;
  isActive: boolean;
}

export interface ManufacturerRank {
  rank: number;
  manufacturer: string;
  receiverCount: number;
  antennaCount: number;
  userCount: number;
  marketShare: number;
}
