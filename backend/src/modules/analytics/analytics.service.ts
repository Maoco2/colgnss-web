import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calculation } from '../calculations/calculation.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getSystemStats() {
    const totalUsers = await this.userRepository.count();
    const totalCalculations = await this.calculationRepository.count();
    
    const calculationsByNetwork = await this.calculationRepository
      .createQueryBuilder('c')
      .select('c.networkType', 'networkType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.networkType')
      .getRawMany();

    const averageTime = await this.calculationRepository
      .createQueryBuilder('c')
      .select('AVG(c.trackingTime)', 'average')
      .getRawOne();

    const usersByRole = await this.userRepository
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role')
      .getRawMany();

    const calculationsByDay = await this.calculationRepository
      .createQueryBuilder('c')
      .select("DATE(c.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('DATE(c.createdAt)')
      .orderBy('DATE(c.createdAt)', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      users: { total: totalUsers, byRole: usersByRole },
      calculations: { total: totalCalculations, byNetwork: calculationsByNetwork, averageTime: Number(averageTime?.average || 0).toFixed(2) },
      dailyCalculations: calculationsByDay,
    };
  }
}
