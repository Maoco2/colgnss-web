import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('calculations')
export class Calculation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.calculations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'real' })
  latitude: number;

  @Column({ type: 'real' })
  longitude: number;

  @Column({ type: 'simple-json', nullable: true })
  pointGeom: object;

  @Column({ name: 'network_type' })
  networkType: string;

  @Column({ name: 'station1_id', nullable: true })
  station1Id: string;

  @Column({ name: 'station2_id', nullable: true })
  station2Id: string;

  @Column({ name: 'station1_name', nullable: true })
  station1Name: string;

  @Column({ name: 'station1_code', nullable: true })
  station1Code: string;

  @Column({ name: 'station2_name', nullable: true })
  station2Name: string;

  @Column({ name: 'station2_code', nullable: true })
  station2Code: string;

  @Column({ name: 'distance1', type: 'real' })
  distance1: number;

  @Column({ name: 'distance2', type: 'real', nullable: true })
  distance2: number;

  @Column({ name: 'tracking_time', type: 'integer' })
  trackingTime: number;

  @Column({ name: 'is_dual_frequency', default: true })
  isDualFrequency: boolean;

  @Column()
  method: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ type: 'simple-json', nullable: true })
  comparisonData: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
