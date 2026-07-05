import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_models')
export class AiModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'float', nullable: true })
  accuracy: number | null;

  @Column({ type: 'simple-json', nullable: true })
  parameters: object | null;

  @Column({ type: 'simple-json', nullable: true })
  metrics: object | null;

  @Column({ name: 'trained_at', type: 'datetime', nullable: true })
  trainedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
