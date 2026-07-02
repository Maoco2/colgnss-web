import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Station } from '../../stations/station.entity';

@Entity('station_statistics')
export class StationStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId: string | null;

  @Column({ name: 'station_code', type: 'varchar', nullable: true, length: 50 })
  stationCode: string | null;

  @Column({ name: 'total_processings', type: 'int', default: 0 })
  totalProcessings: number;

  @Column({ name: 'avg_time', type: 'float', default: 0 })
  avgTime: number;

  @Column({ name: 'total_campaigns', type: 'int', default: 0 })
  totalCampaigns: number;

  @Column({ name: 'total_files', type: 'int', default: 0 })
  totalFiles: number;

  @Column({ name: 'total_observations', type: 'int', default: 0 })
  totalObservations: number;

  @Column({ name: 'total_satellites', type: 'int', default: 0 })
  totalSatellites: number;

  @Column({ name: 'total_ppp', type: 'int', default: 0 })
  totalPpp: number;

  @ManyToOne(() => Station)
  @JoinColumn({ name: 'station_id' })
  station: Station | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
