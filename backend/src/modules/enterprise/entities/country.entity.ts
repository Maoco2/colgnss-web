import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', unique: true, length: 5 })
  code: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  flag: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
