import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class PremiumService {
  private readonly PREMIUM_PRICE = 9.99;
  private readonly PREMIUM_DURATION_DAYS = 30;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getPremiumStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isActive = user.role === UserRole.PREMIUM && 
      !!user.premiumExpiresAt && user.premiumExpiresAt > new Date();

    return {
      isPremium: isActive,
      role: user.role,
      expiresAt: user.premiumExpiresAt,
      price: this.PREMIUM_PRICE,
      durationDays: this.PREMIUM_DURATION_DAYS,
    };
  }

  async activatePremium(userId: string, paymentId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.PREMIUM_DURATION_DAYS);

    user.role = UserRole.PREMIUM;
    user.premiumExpiresAt = expiresAt;
    user.stripeCustomerId = paymentId;

    await this.userRepository.save(user);

    return {
      isPremium: true,
      expiresAt,
      message: 'Premium activated successfully',
    };
  }

  async cancelPremium(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.role = UserRole.USER;
    user.premiumExpiresAt = null as any;

    await this.userRepository.save(user);

    return { message: 'Premium subscription cancelled' };
  }

  async getPremiumFeatures(): Promise<string[]> {
    return [
      'Sin anuncios',
      'Descarga automática de RINEX',
      'Exportaciones ilimitadas',
      'Informes avanzados',
      'Sincronización de proyectos',
      'Herramientas avanzadas de análisis',
    ];
  }
}
