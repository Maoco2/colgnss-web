import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('advertisements')
export class Advertisement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ type: 'varchar', length: 30 })
  platform: string;

  @Column({ type: 'text', nullable: true })
  code: string | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true, length: 500 })
  imageUrl: string | null;

  @Column({ name: 'link_url', type: 'varchar', nullable: true, length: 500 })
  linkUrl: string | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ name: 'total_clicks', type: 'int', default: 0 })
  totalClicks: number;

  @Column({ name: 'total_impressions', type: 'int', default: 0 })
  totalImpressions: number;

  @Column({ type: 'float', default: 0 })
  ctr: number;

  @Column({ type: 'float', default: 0 })
  revenue: number;

  @Column({ name: 'daily_revenue', type: 'simple-json', nullable: true })
  dailyRevenue: object | null;

  @Column({ name: 'monthly_revenue', type: 'simple-json', nullable: true })
  monthlyRevenue: object | null;

  @Column({ name: 'campaign_name', type: 'varchar', nullable: true, length: 255 })
  campaignName: string | null;

  @Column({ type: 'float', nullable: true })
  budget: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
