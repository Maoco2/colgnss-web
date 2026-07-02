import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('data_warehouse')
export class DataWarehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  period: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'varchar', length: 100 })
  metric: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  dimension: string | null;

  @Column({ name: 'dimension_value', type: 'varchar', nullable: true, length: 100 })
  dimensionValue: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
