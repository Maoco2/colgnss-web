export interface StationStat {
  id: string;
  name: string;
  code: string;
  location: {
    lat: number;
    lng: number;
    elevation?: number;
  };
  country: string;
  city?: string;
  receiverType?: string;
  antennaType?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  uptime: number;
  lastContact: string;
  satellitesTracked: number;
  dataQuality: number;
  processingCount: number;
  createdAt: string;
  updatedAt: string;
}
