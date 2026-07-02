import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Station, StationType } from '../stations/station.entity';
import { Calculation } from '../calculations/calculation.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(Calculation)
    private calculationRepository: Repository<Calculation>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, premiumUsers, adminUsers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.PREMIUM } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
    ]);

    const [totalStations, activeStations, passiveStations] = await Promise.all([
      this.stationRepository.count(),
      this.stationRepository.count({ where: { type: StationType.ACTIVE } }),
      this.stationRepository.count({ where: { type: StationType.PASSIVE } }),
    ]);

    const totalCalculations = await this.calculationRepository.count();
    const todayCalculations = await this.calculationRepository.count({
      where: { createdAt: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    const recentUsers = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentCalculations = await this.calculationRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['user'],
    });

    return {
      users: { total: totalUsers, premium: premiumUsers, admin: adminUsers },
      stations: { total: totalStations, active: activeStations, passive: passiveStations },
      calculations: { total: totalCalculations, today: todayCalculations },
      recentUsers: recentUsers.map(u => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role, createdAt: u.createdAt })),
      recentCalculations: recentCalculations.map(c => ({
        id: c.id, userEmail: (c as any).user?.email, networkType: c.networkType,
        trackingTime: c.trackingTime, createdAt: c.createdAt,
      })),
    };
  }

  async getUsers(page = 1, limit = 20) {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data: data.map(({ password, ...u }) => u), total, page, limit };
  }
}
