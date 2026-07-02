import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('receiver_statistics')
export class ReceiverStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  receiver: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  manufacturer: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  model: string | null;

  @Column({ name: 'total_uses', type: 'int' })
  totalUses: number;

  @Column({ name: 'avg_time', type: 'float' })
  avgTime: number;

  @Column({ name: 'total_files', type: 'int' })
  totalFiles: number;

  @Column({ name: 'total_observations', type: 'int' })
  totalObservations: number;

  @Column({ name: 'total_satellites', type: 'int' })
  totalSatellites: number;

  @Column({ name: 'last_used', type: 'datetime', nullable: true })
  lastUsed: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
