export interface ConstellationStat {
  constellation: string;
  satelliteCount: number;
  healthyCount: number;
  unhealthyCount: number;
  avgSnr: number;
  avgElevation: number;
  avgAzimuth: number;
  pdop: number;
  hdop: number;
  vdop: number;
  timestamp: string;
}

export interface GnssOverview {
  totalSatellites: number;
  trackedSatellites: number;
  visibleSatellites: number;
  constellations: ConstellationStat[];
  globalPdop: number;
  globalHdop: number;
  globalVdop: number;
  lastUpdate: string;
}
