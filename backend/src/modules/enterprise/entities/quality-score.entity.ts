import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('quality_scores')
export class QualityScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'processing_id', type: 'uuid', nullable: true })
  processingId: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'float' })
  score: number;

  @Column({ type: 'varchar', length: 20 })
  category: string;

  @Column({ type: 'int' })
  observations: number;

  @Column({ type: 'int' })
  epochs: number;

  @Column({ type: 'int' })
  satellites: number;

  @Column({ type: 'int', nullable: true })
  gaps: number | null;

  @Column({ type: 'float', nullable: true })
  multipath: number | null;

  @Column({ type: 'float', nullable: true })
  snr: number | null;

  @Column({ type: 'float', nullable: true })
  completeness: number | null;

  @Column({ type: 'simple-json', nullable: true })
  issues: object | null;

  @Column({ type: 'text', nullable: true })
  recommendations: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
