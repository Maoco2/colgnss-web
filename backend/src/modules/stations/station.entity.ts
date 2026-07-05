import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StationType {
  ACTIVE = 'active',
  PASSIVE = 'passive',
}

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'simple-enum', enum: StationType })
  type: StationType;

  @Column()
  department: string;

  @Column()
  municipality: string;

  @Column({ type: 'real' })
  latitude: number;

  @Column({ type: 'real' })
  longitude: number;

  @Column({ type: 'real', nullable: true })
  height: number;

  @Column({ type: 'simple-json', nullable: true })
  geom: object;

  @Column({ name: 'coord_x', type: 'float', nullable: true })
  coordX: number;

  @Column({ name: 'coord_y', type: 'float', nullable: true })
  coordY: number;

  @Column({ name: 'coord_z', type: 'float', nullable: true })
  coordZ: number;

  @Column({ nullable: true, type: 'float' })
  ondula: number;

  @Column({ name: 'est_punto', nullable: true })
  estPunto: string;

  @Column({ nullable: true, type: 'smallint' })
  orden: number;

  @Column({ name: 'receiver_type', nullable: true })
  receiverType: string;

  @Column({ name: 'antenna_type', nullable: true })
  antennaType: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'influence_radius', type: 'real', nullable: true })
  influenceRadius: number;

  @Column({ name: 'material_type', nullable: true })
  materialType: string;

  @Column({ name: 'monumentation_type', nullable: true })
  monumentationType: string;

  @Column({ name: 'rinex_url', nullable: true })
  rinexUrl: string;

  @Column({ type: 'simple-json', nullable: true })
  photos: string[];

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ name: 'admin_entity', nullable: true })
  adminEntity: string;

  @Column({ name: 'divipola_code', nullable: true })
  divipolaCode: string;

  @Column({ name: 'installation_date', nullable: true, type: 'datetime' })
  installationDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
