import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiKey } from './api-key.entity';

@Entity('api_usage_logs')
export class ApiUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'api_key_id', type: 'uuid' })
  apiKeyId: string;

  @Column({ type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ name: 'response_time', type: 'float' })
  responseTime: number;

  @ManyToOne(() => ApiKey)
  @JoinColumn({ name: 'api_key_id' })
  apiKey: ApiKey;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
