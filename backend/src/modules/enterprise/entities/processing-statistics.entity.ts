import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('processing_statistics')
export class ProcessingStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'total_processings', type: 'int', default: 0 })
  totalProcessings: number;

  @Column({ name: 'success_count', type: 'int', default: 0 })
  successCount: number;

  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount: number;

  @Column({ name: 'total_time', type: 'float', default: 0 })
  totalTime: number;

  @Column({ name: 'avg_time', type: 'float', default: 0 })
  avgTime: number;

  @Column({ name: 'total_observations', type: 'int', default: 0 })
  totalObservations: number;

  @Column({ name: 'total_epochs', type: 'int', default: 0 })
  totalEpochs: number;

  @Column({ name: 'total_files', type: 'int', default: 0 })
  totalFiles: number;

  @Column({ name: 'by_module', type: 'simple-json', nullable: true })
  byModule: object | null;

  @Column({ name: 'by_rinex_version', type: 'simple-json', nullable: true })
  byRinexVersion: object | null;

  @Column({ name: 'by_constellation', type: 'simple-json', nullable: true })
  byConstellation: object | null;

  @Column({ name: 'by_country', type: 'simple-json', nullable: true })
  byCountry: object | null;

  @Column({ name: 'by_city', type: 'simple-json', nullable: true })
  byCity: object | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
