import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Calculation } from '../calculations/calculation.entity';
import { Role } from '../enterprise/entities/role.entity';
import { Country } from '../enterprise/entities/country.entity';
import { Department } from '../enterprise/entities/department.entity';
import { City } from '../enterprise/entities/city.entity';

export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  surname: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  profession: string | null;

  @Column({ type: 'varchar', enum: Gender, nullable: true })
  gender: string | null;

  @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'firebase_uid', type: 'varchar', nullable: true })
  firebaseUid: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  company: string | null;

  @Column({ type: 'varchar', nullable: true })
  university: string | null;

  @Column({ name: 'country_id', type: 'uuid', nullable: true })
  countryId: string | null;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'city_id', type: 'uuid', nullable: true })
  cityId: string | null;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string | null;

  @Column({ name: 'session_count', type: 'int', default: 0 })
  sessionCount: number;

  @Column({ name: 'visit_count', type: 'int', default: 0 })
  visitCount: number;

  @Column({ name: 'total_processing_time', type: 'float', default: 0 })
  totalProcessingTime: number;

  @Column({ name: 'storage_used', type: 'float', default: 0 })
  storageUsed: number;

  @Column({ name: 'last_ip', type: 'varchar', nullable: true, length: 45 })
  lastIp: string | null;

  @Column({ name: 'last_user_agent', type: 'text', nullable: true })
  lastUserAgent: string | null;

  @Column({ name: 'enterprise_last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true })
  stripeCustomerId: string | null;

  @Column({ name: 'premium_expires_at', nullable: true, type: 'datetime' })
  premiumExpiresAt: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', nullable: true, type: 'datetime' })
  lastLogin: Date | null;

  @OneToMany(() => Calculation, calculation => calculation.user)
  calculations: Calculation[];

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  enterpriseRole: Role | null;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country: Country | null;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department | null;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
