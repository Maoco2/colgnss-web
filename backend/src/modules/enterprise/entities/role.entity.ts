import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';
import { User } from '../../users/user.entity';
import { Permission } from './permission.entity';

export enum EnterpriseRoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 50 })
  name: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  description: string | null;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @OneToMany(() => User, user => user.enterpriseRole)
  users: User[];

  @ManyToMany(() => Permission, permission => permission.roles)
  permissions: Permission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
