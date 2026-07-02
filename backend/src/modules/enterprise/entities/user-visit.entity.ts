import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('user_visits')
export class UserVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  page: string;

  @Column({ type: 'text', nullable: true })
  referrer: string | null;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ name: 'user_agent', type: 'text' })
  userAgent: string;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
