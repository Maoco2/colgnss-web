import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AlertConfig } from './alert-config.entity';

@Entity('alert_events')
export class AlertEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  @Column({ type: 'varchar', length: 50 })
  metric: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ type: 'float' })
  threshold: number;

  @Column({ type: 'varchar', length: 10 })
  severity: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'sent_at', type: 'timestamp' })
  sentAt: Date;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date | null;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy: string | null;

  @ManyToOne(() => AlertConfig)
  @JoinColumn({ name: 'config_id' })
  config: AlertConfig;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
