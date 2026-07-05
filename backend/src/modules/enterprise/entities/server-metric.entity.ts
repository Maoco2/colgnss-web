import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('server_metrics')
export class ServerMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ name: 'cpu_usage', type: 'float' })
  cpuUsage: number;

  @Column({ name: 'ram_usage', type: 'float' })
  ramUsage: number;

  @Column({ name: 'ram_total', type: 'bigint', nullable: true })
  ramTotal: number | null;

  @Column({ name: 'ram_used', type: 'bigint', nullable: true })
  ramUsed: number | null;

  @Column({ name: 'disk_usage', type: 'float' })
  diskUsage: number;

  @Column({ name: 'disk_total', type: 'bigint', nullable: true })
  diskTotal: number | null;

  @Column({ name: 'disk_used', type: 'bigint', nullable: true })
  diskUsed: number | null;

  @Column({ name: 'storage_used', type: 'bigint', nullable: true })
  storageUsed: number | null;

  @Column({ name: 'api_response_time', type: 'float' })
  apiResponseTime: number;

  @Column({ name: 'active_connections', type: 'int' })
  activeConnections: number;

  @Column({ name: 'total_requests', type: 'int' })
  totalRequests: number;

  @Column({ name: 'error_count', type: 'int' })
  errorCount: number;

  @Column({ name: 'db_connections', type: 'int', nullable: true })
  dbConnections: number | null;

  @Column({ name: 'db_size', type: 'bigint', nullable: true })
  dbSize: number | null;

  @Column({ type: 'float', nullable: true })
  latency: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
