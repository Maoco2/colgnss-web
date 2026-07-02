import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculation } from '../calculations/calculation.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
  ) {}

  async findAll(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.calculationRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
       select: ['id', 'latitude', 'longitude', 'networkType', 'trackingTime', 'method', 'distance1', 'station1Name', 'station1Code', 'station2Name', 'station2Code', 'isDualFrequency', 'observations', 'createdAt'],
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
