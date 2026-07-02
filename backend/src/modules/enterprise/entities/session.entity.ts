import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ name: 'user_agent', type: 'text' })
  userAgent: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  device: string | null;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  os: string | null;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  browser: string | null;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  language: string | null;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  timezone: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'login_at', type: 'timestamp' })
  loginAt: Date;

  @Column({ name: 'logout_at', type: 'timestamp', nullable: true })
  logoutAt: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
