import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('coordinate_conversion_history')
export class ConversionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'source_system_id', type: 'int' })
  sourceSystemId: number;

  @Column({ name: 'source_system_name' })
  sourceSystemName: string;

  @Column({ name: 'source_coord_type' })
  sourceCoordType: string;

  @Column({ name: 'source_origin_id', type: 'int', nullable: true })
  sourceOriginId: number;

  @Column({ name: 'source_origin_name', nullable: true })
  sourceOriginName: string;

  @Column({ name: 'target_system_id', type: 'int' })
  targetSystemId: number;

  @Column({ name: 'target_system_name' })
  targetSystemName: string;

  @Column({ name: 'target_coord_type' })
  targetCoordType: string;

  @Column({ name: 'target_origin_id', type: 'int', nullable: true })
  targetOriginId: number;

  @Column({ name: 'target_origin_name', nullable: true })
  targetOriginName: string;

  @Column({ name: 'original_coords', type: 'simple-json' })
  originalCoords: object;

  @Column({ name: 'converted_coords', type: 'simple-json' })
  convertedCoords: object;

  @Column({ name: 'processing_time_ms', type: 'real' })
  processingTimeMs: number;

  @Column({ name: 'file_name', nullable: true })
  fileName: string;

  @Column({ name: 'total_records', type: 'int', nullable: true })
  totalRecords: number;

  @Column({ name: 'success_count', type: 'int', nullable: true })
  successCount: number;

  @Column({ name: 'error_count', type: 'int', nullable: true })
  errorCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
