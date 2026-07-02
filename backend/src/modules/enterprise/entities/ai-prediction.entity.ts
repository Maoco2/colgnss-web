import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AiModel } from './ai-model.entity';

@Entity('ai_predictions')
export class AiPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'model_id', type: 'uuid' })
  modelId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ name: 'input_data', type: 'simple-json' })
  inputData: object;

  @Column({ name: 'output_data', type: 'simple-json' })
  outputData: object;

  @Column({ type: 'float', nullable: true })
  confidence: number | null;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ name: 'processing_time', type: 'float', nullable: true })
  processingTime: number | null;

  @ManyToOne(() => AiModel)
  @JoinColumn({ name: 'model_id' })
  model: AiModel;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
