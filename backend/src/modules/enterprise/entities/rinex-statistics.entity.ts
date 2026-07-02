import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rinex_statistics')
export class RinexStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'total_files', type: 'int' })
  totalFiles: number;

  @Column({ name: 'by_version', type: 'simple-json' })
  byVersion: object;

  @Column({ name: 'by_constellation', type: 'simple-json' })
  byConstellation: object;

  @Column({ name: 'total_observations', type: 'int' })
  totalObservations: number;

  @Column({ name: 'total_epochs', type: 'int' })
  totalEpochs: number;

  @Column({ name: 'total_satellites', type: 'int' })
  totalSatellites: number;

  @Column({ name: 'avg_satellites', type: 'float' })
  avgSatellites: number;

  @Column({ name: 'max_simultaneous', type: 'int' })
  maxSimultaneous: number;

  @Column({ name: 'avg_interval', type: 'float' })
  avgInterval: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
