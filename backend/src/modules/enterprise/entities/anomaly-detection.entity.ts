import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('anomaly_detections')
export class AnomalyDetection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ type: 'float' })
  value: number;

  @Column({ name: 'expected_min', type: 'float' })
  expectedMin: number;

  @Column({ name: 'expected_max', type: 'float' })
  expectedMax: number;

  @Column({ type: 'float' })
  deviation: number;

  @Column({ type: 'varchar', length: 10 })
  severity: string;

  @Column({ name: 'detected_at', type: 'timestamp' })
  detectedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'simple-json', nullable: true })
  details: object | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
