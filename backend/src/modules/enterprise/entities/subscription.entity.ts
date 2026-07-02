import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  plan: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ name: 'start_date', type: 'datetime' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'datetime', nullable: true })
  endDate: Date | null;

  @Column({ name: 'trial_end_date', type: 'datetime', nullable: true })
  trialEndDate: Date | null;

  @Column({ name: 'auto_renew', default: true })
  autoRenew: boolean;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
