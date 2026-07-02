import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Station } from '../../stations/station.entity';

@Entity('processing_history')
export class ProcessingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'file_type', type: 'varchar', length: 20 })
  fileType: string;

  @Column({ name: 'file_version', type: 'varchar', nullable: true, length: 10 })
  fileVersion: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null;

  @Column({ type: 'simple-json', nullable: true })
  constellations: string[] | null;

  @Column({ type: 'int', default: 0 })
  observations: number;

  @Column({ type: 'int', default: 0 })
  epochs: number;

  @Column({ name: 'avg_satellites', type: 'float', nullable: true })
  avgSatellites: number | null;

  @Column({ name: 'max_simultaneous', type: 'int', nullable: true })
  maxSimultaneous: number | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  receiver: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  antenna: string | null;

  @Column({ type: 'float', nullable: true })
  interval: number | null;

  @Column({ type: 'text', nullable: true })
  result: string | null;

  @Column({ type: 'float', nullable: true })
  time: number | null;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'text', nullable: true })
  errors: string | null;

  @Column({ name: 'is_ppp', default: false })
  isPpp: boolean;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  country: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  department: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  city: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Station)
  @JoinColumn({ name: 'station_id' })
  station: Station | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
