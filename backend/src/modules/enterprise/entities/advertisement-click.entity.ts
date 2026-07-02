import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Advertisement } from './advertisement.entity';
import { User } from '../../users/user.entity';

@Entity('advertisement_clicks')
export class AdvertisementClick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'advertisement_id', type: 'uuid' })
  advertisementId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'text', nullable: true })
  referrer: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  page: string | null;

  @Column({ name: 'clicked_at', type: 'timestamp' })
  clickedAt: Date;

  @Column({ type: 'float', default: 0 })
  revenue: number;

  @ManyToOne(() => Advertisement)
  @JoinColumn({ name: 'advertisement_id' })
  advertisement: Advertisement;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
