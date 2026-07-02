import { Injectable } from '@nestjs/common';
import { StationsService } from '../stations/stations.service';
import { getDistance } from 'geolib';

export interface NearbyStation {
  id: string;
  name: string;
  code: string;
  type: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export interface StationLocationResult {
  station1: NearbyStation | null;
  station2: NearbyStation | null;
  usedStation: NearbyStation | null;
  usedDistanceKm: number;
}

@Injectable()
export class StationLocatorService {
  constructor(private readonly stationsService: StationsService) {}

  async locate(
    lat: number,
    lon: number,
    networkType: string,
  ): Promise<StationLocationResult> {
    const stationType = networkType === 'active' ? 'active'
      : networkType === 'passive' ? 'passive'
      : undefined;

    let stations: any[] = [];
    try {
      stations = await this.stationsService.findNearest(
        lat, lon, stationType as any, 2,
      );
    } catch {
      return { station1: null, station2: null, usedStation: null, usedDistanceKm: 0 };
    }

    if (stations.length === 0) {
      return { station1: null, station2: null, usedStation: null, usedDistanceKm: 0 };
    }

    const station1 = stations[0];
    const station2 = stations.length > 1 ? stations[1] : null;

    const dist1 = this.calcDistance(lat, lon, station1.latitude, station1.longitude);
    const dist2 = station2
      ? this.calcDistance(lat, lon, station2.latitude, station2.longitude)
      : 0;

    const usedStation = dist2 >= dist1 && station2 ? station2 : station1;
    const usedDistance = dist2 >= dist1 ? dist2 : dist1;

    return {
      station1: this.toNearby(station1, dist1),
      station2: station2 ? this.toNearby(station2, dist2) : null,
      usedStation: this.toNearby(usedStation, usedDistance),
      usedDistanceKm: Math.round(usedDistance * 1000) / 1000,
    };
  }

  private calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 },
    ) / 1000;
  }

  private toNearby(station: any, distanceKm: number): NearbyStation {
    return {
      id: station.id,
      name: station.name,
      code: station.code,
      type: station.type,
      latitude: station.latitude,
      longitude: station.longitude,
      distanceKm: Math.round(distanceKm * 1000) / 1000,
    };
  }
}
