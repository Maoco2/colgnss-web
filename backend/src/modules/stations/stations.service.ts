import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { getDistance } from 'geolib';
import { Station, StationType } from './station.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { FilterStationDto } from './dto/filter-station.dto';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async create(dto: CreateStationDto): Promise<Station> {
    const station = this.stationRepository.create({
      ...dto,
      geom: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
    });
    return this.stationRepository.save(station);
  }

  async findAll(filters: FilterStationDto) {
    const baseWhere: any = {};
    if (filters.type) baseWhere.type = filters.type;
    if (filters.department) baseWhere.department = filters.department;
    if (filters.municipality) baseWhere.municipality = filters.municipality;
    if (filters.status) baseWhere.status = filters.status;

    let where: any = baseWhere;
    if (filters.search) {
      const term = Like(`%${filters.search}%`);
      where = [
        { ...baseWhere, name: term },
        { ...baseWhere, code: term },
        { ...baseWhere, municipality: term },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const [data, total] = await this.stationRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<Station> {
    const station = await this.stationRepository.findOne({ where: { id } });
    if (!station) throw new NotFoundException('Station not found');
    return station;
  }

  async update(id: string, dto: UpdateStationDto): Promise<Station> {
    const station = await this.findById(id);
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      (station as any).geom = {
        type: 'Point',
        coordinates: [dto.longitude || station.longitude, dto.latitude || station.latitude],
      };
    }
    Object.assign(station, dto);
    return this.stationRepository.save(station);
  }

  async remove(id: string): Promise<void> {
    const result = await this.stationRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Station not found');
  }

  async findNearest(latitude: number, longitude: number, type?: string, limit = 2) {
    const where: any = {};
    if (type && type !== 'mixed') where.type = type;

    const stations = await this.stationRepository.find({ where });

    const withDistance = stations.map(s => ({
      ...s,
      _distance: getDistance(
        { latitude, longitude },
        { latitude: s.latitude, longitude: s.longitude },
      ),
    }));

    withDistance.sort((a, b) => a._distance - b._distance);
    return withDistance.slice(0, limit);
  }

  async findWithinRadius(latitude: number, longitude: number, radiusKm: number, type?: StationType) {
    const where: any = {};
    if (type) where.type = type;

    const stations = await this.stationRepository.find({ where });

    return stations.filter(s => {
      const dist = getDistance(
        { latitude, longitude },
        { latitude: s.latitude, longitude: s.longitude },
      );
      return dist <= radiusKm * 1000;
    });
  }

  async getDepartments(): Promise<string[]> {
    const stations = await this.stationRepository.find({ select: ['department'] });
    return [...new Set(stations.map(s => s.department))].sort();
  }

  async getStatistics() {
    const total = await this.stationRepository.count();
    const active = await this.stationRepository.count({ where: { type: StationType.ACTIVE } });
    const passive = await this.stationRepository.count({ where: { type: StationType.PASSIVE } });
    return { total, active, passive };
  }
}
