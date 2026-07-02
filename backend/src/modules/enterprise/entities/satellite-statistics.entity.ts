import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('satellite_statistics')
export class SatelliteStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  constellation: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'total_files', type: 'int' })
  totalFiles: number;

  @Column({ name: 'total_observations', type: 'int' })
  totalObservations: number;

  @Column({ name: 'total_epochs', type: 'int' })
  totalEpochs: number;

  @Column({ name: 'avg_satellites', type: 'float' })
  avgSatellites: number;

  @Column({ name: 'max_satellites', type: 'int' })
  maxSatellites: number;

  @Column({ type: 'float' })
  availability: number;

  @Column({ name: 'usage_frequency', type: 'float' })
  usageFrequency: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
