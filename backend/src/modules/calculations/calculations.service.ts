import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getDistance } from 'geolib';
import { Calculation } from './calculation.entity';
import { CalculateTrackingTimeDto, NetworkType } from './dto/calculate-tracking-time.dto';
import { StationsService } from '../stations/stations.service';
import { StationType } from '../stations/station.entity';

@Injectable()
export class CalculationsService {
  // Parameterized algorithm per Resolución 643 de 2018
  private readonly BASE_TIME = 65; // minutes for < 10km
  private readonly DISTANCE_THRESHOLD = 10; // km
  private readonly MAX_DISTANCE = 80; // km
  private readonly TIME_PER_KM = 3; // minutes per km beyond threshold
  private readonly SINGLE_FREQUENCY_MULTIPLIER = 2;

  constructor(
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
    private stationsService: StationsService,
  ) {}

  async calculate(userId: string, dto: CalculateTrackingTimeDto) {
    if (!dto.latitude || !dto.longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    let nearestStations: any[] = [];

    if (dto.networkType === NetworkType.COMPARISON) {
      // Find nearest from both networks for comparison
      const activeStations = await this.stationsService.findNearest(
        dto.latitude, dto.longitude, StationType.ACTIVE, 2
      );
      const passiveStations = await this.stationsService.findNearest(
        dto.latitude, dto.longitude, StationType.PASSIVE, 2
      );
      nearestStations = [...activeStations, ...passiveStations];
    } else {
      nearestStations = await this.stationsService.findNearest(
        dto.latitude, dto.longitude, 
        dto.networkType === NetworkType.MIXED ? undefined : dto.networkType,
        2
      );
    }

    if (nearestStations.length === 0) {
      throw new BadRequestException('No stations found near the selected point');
    }

    const station1 = nearestStations[0];
    const station2 = nearestStations.length > 1 ? nearestStations[1] : null;

    const distance1 = this.calculateDistance(
      dto.latitude, dto.longitude,
      station1.latitude, station1.longitude
    );

    let distance2 = 0;
    if (station2) {
      distance2 = this.calculateDistance(
        dto.latitude, dto.longitude,
        station2.latitude, station2.longitude
      );
    }

    const isDualFreq = dto.isDualFrequency !== false;
    const farthestDist = station2 ? Math.max(distance1, distance2) : distance1;
    const trackingTime = this.calculateTrackingTime(
      farthestDist,
      isDualFreq
    );

    // Build comparison data if applicable
    let comparisonData = null;
    if (dto.networkType === NetworkType.COMPARISON) {
      comparisonData = this.buildComparison(dto.latitude, dto.longitude, nearestStations, isDualFreq);
    }

    // Determine method description
    let method = `Resolución 643 de 2018 - Red ${dto.networkType}`;
    let observations = '';

    if (distance1 > this.MAX_DISTANCE) {
      observations = `ADVERTENCIA: La distancia a la estación más cercana (${distance1.toFixed(2)} km) supera los ${this.MAX_DISTANCE} km recomendados. Considere usar otra estación de referencia.`;
    }

    if (!isDualFreq) {
      observations += (observations ? ' ' : '') + 'Receptor de una sola frecuencia (L1) - tiempo duplicado.';
    }

    const calcData = {
      userId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      pointGeom: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      },
      networkType: dto.networkType,
      station1Id: station1.id,
      station2Id: station2?.id || null,
      station1Name: station1.name,
      station1Code: station1.code,
      station2Name: station2?.name || null,
      station2Code: station2?.code || null,
      distance1: Math.round(distance1 * 100) / 100,
      distance2: station2 ? Math.round(distance2 * 100) / 100 : null,
      trackingTime,
      isDualFrequency: isDualFreq,
      method,
      observations,
      comparisonData,
    };
    const calculation = await this.calculationRepository.save(calcData as any);

    return {
      id: calculation.id,
      selectedPoint: { lat: dto.latitude, lng: dto.longitude },
      station1: {
        id: station1.id,
        name: station1.name,
        code: station1.code,
        type: station1.type,
        latitude: station1.latitude,
        longitude: station1.longitude,
        distance: Math.round(distance1 * 100) / 100,
      },
      station2: station2 ? {
        id: station2.id,
        name: station2.name,
        code: station2.code,
        type: station2.type,
        latitude: station2.latitude,
        longitude: station2.longitude,
        distance: Math.round(distance2 * 100) / 100,
      } : null,
      trackingTime,
      networkType: dto.networkType,
      method,
      observations,
      isDualFrequency: isDualFreq,
      comparisonData,
      createdAt: calculation.createdAt,
    };
  }

  async findById(id: string): Promise<Calculation> {
    const calc = await this.calculationRepository.findOne({ where: { id } });
    if (!calc) throw new BadRequestException('Calculation not found');
    return calc;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.calculationRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(id: string, userId: string): Promise<void> {
    const calc = await this.findById(id);
    if (calc.userId !== userId) throw new BadRequestException('Not authorized');
    await this.calculationRepository.remove(calc);
  }

  async deleteAll(userId: string): Promise<void> {
    await this.calculationRepository.delete({ userId });
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    ) / 1000; // Convert to km
  }

  calculateTrackingTime(distanceKm: number, isDualFrequency: boolean): number {
    let time: number;

    if (distanceKm <= this.DISTANCE_THRESHOLD) {
      time = this.BASE_TIME;
    } else if (distanceKm <= this.MAX_DISTANCE) {
      time = this.BASE_TIME + this.TIME_PER_KM * (distanceKm - this.DISTANCE_THRESHOLD);
    } else {
      time = this.BASE_TIME + this.TIME_PER_KM * (this.MAX_DISTANCE - this.DISTANCE_THRESHOLD);
    }

    if (!isDualFrequency) {
      time *= this.SINGLE_FREQUENCY_MULTIPLIER;
    }

    return Math.round(time);
  }

  private buildComparison(lat: number, lng: number, stations: any[], isDualFreq: boolean) {
    const active = stations.filter(s => s.type === StationType.ACTIVE);
    const passive = stations.filter(s => s.type === StationType.PASSIVE);
    
    const results: any[] = [];

    [StationType.ACTIVE, StationType.PASSIVE].forEach(type => {
      const typeStations = type === StationType.ACTIVE ? active : passive;
      if (typeStations.length > 0) {
        const farthest = typeStations.length > 1 ? typeStations[1] : typeStations[0];
        const dist = this.calculateDistance(lat, lng, farthest.latitude, farthest.longitude);
        results.push({
          networkType: type,
          station: farthest.name,
          distance: Math.round(dist * 100) / 100,
          trackingTime: this.calculateTrackingTime(dist, isDualFreq),
          isRecommended: false,
        });
      }
    });

    // Build mixed option (best of both)
    const allWithDist = stations.map(s => ({
      ...s,
      distance: this.calculateDistance(lat, lng, s.latitude, s.longitude),
    })).sort((a, b) => a.distance - b.distance);

    if (allWithDist.length >= 2) {
      const farthestDist = allWithDist[1].distance;
      results.push({
        networkType: 'mixed',
        station: `${allWithDist[0].name} + ${allWithDist[1].name}`,
        distance: Math.round(farthestDist * 100) / 100,
        trackingTime: this.calculateTrackingTime(farthestDist, isDualFreq),
        isRecommended: true,
      });
    }

    // Sort by tracking time and mark best
    results.sort((a, b) => a.trackingTime - b.trackingTime);
    if (results.length > 0) results[0].isRecommended = true;

    return results;
  }
}
