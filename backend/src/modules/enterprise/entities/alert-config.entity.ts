import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('alert_configs')
export class AlertConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  metric: string;

  @Column({ type: 'varchar', length: 5 })
  operator: string;

  @Column({ type: 'float' })
  threshold: number;

  @Column({ type: 'int', default: 300 })
  duration: number;

  @Column({ type: 'simple-json', nullable: true })
  channels: string[] | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 3600 })
  cooldown: number;

  @Column({ name: 'last_triggered_at', type: 'datetime', nullable: true })
  lastTriggeredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
