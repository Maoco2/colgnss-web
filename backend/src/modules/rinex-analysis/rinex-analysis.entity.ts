import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('rinex_analyses')
export class RinexAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'rinex_version', nullable: true })
  rinexVersion: string;

  @Column({ name: 'file_type', nullable: true })
  fileType: string;

  @Column({ name: 'satellite_system', nullable: true })
  satelliteSystem: string;

  @Column({ name: 'marker_name', nullable: true })
  markerName: string;

  @Column({ name: 'marker_number', nullable: true })
  markerNumber: string;

  @Column({ name: 'marker_type', nullable: true })
  markerType: string;

  @Column({ name: 'observer', nullable: true })
  observer: string;

  @Column({ name: 'receiver_brand', nullable: true })
  receiverBrand: string;

  @Column({ name: 'receiver_model', nullable: true })
  receiverModel: string;

  @Column({ name: 'receiver_serial', nullable: true })
  receiverSerial: string;

  @Column({ name: 'receiver_firmware', nullable: true })
  receiverFirmware: string;

  @Column({ name: 'antenna_model', nullable: true })
  antennaModel: string;

  @Column({ name: 'antenna_type', nullable: true })
  antennaType: string;

  @Column({ name: 'antenna_serial', nullable: true })
  antennaSerial: string;

  @Column({ name: 'antenna_height', type: 'float', nullable: true })
  antennaHeight: number;

  @Column({ name: 'antenna_delta_n', type: 'float', nullable: true })
  antennaDeltaN: number;

  @Column({ name: 'antenna_delta_e', type: 'float', nullable: true })
  antennaDeltaE: number;

  @Column({ name: 'antenna_delta_h', type: 'float', nullable: true })
  antennaDeltaH: number;

  @Column({ name: 'approx_x', type: 'float', nullable: true })
  approxX: number;

  @Column({ name: 'approx_y', type: 'float', nullable: true })
  approxY: number;

  @Column({ name: 'approx_z', type: 'float', nullable: true })
  approxZ: number;

  @Column({ name: 'latitude', type: 'float', nullable: true })
  latitude: number;

  @Column({ name: 'longitude', type: 'float', nullable: true })
  longitude: number;

  @Column({ name: 'height', type: 'float', nullable: true })
  height: number;

  @Column({ name: 'coord_system', nullable: true })
  coordSystem: string;

  @Column({ name: 'start_time', nullable: true })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true })
  endTime: Date;

  @Column({ name: 'observed_duration', type: 'float', nullable: true })
  observedDuration: number;

  @Column({ name: 'effective_duration', type: 'float', nullable: true })
  effectiveDuration: number;

  @Column({ name: 'interval_nominal', type: 'float', nullable: true })
  intervalNominal: number;

  @Column({ name: 'interval_avg', type: 'float', nullable: true })
  intervalAvg: number;

  @Column({ name: 'interval_min', type: 'float', nullable: true })
  intervalMin: number;

  @Column({ name: 'interval_max', type: 'float', nullable: true })
  intervalMax: number;

  @Column({ name: 'interval_std_dev', type: 'float', nullable: true })
  intervalStdDev: number;

  @Column({ name: 'num_epochs', type: 'int', nullable: true })
  numEpochs: number;

  @Column({ name: 'continuity_percent', type: 'float', nullable: true })
  continuityPercent: number;

  @Column({ name: 'gaps', type: 'int', nullable: true })
  gaps: number;

  @Column({ name: 'lost_epochs', type: 'int', nullable: true })
  lostEpochs: number;

  @Column({ name: 'constellations', type: 'simple-json', nullable: true })
  constellations: string[];

  @Column({ name: 'num_satellites_avg', type: 'float', nullable: true })
  numSatellitesAvg: number;

  @Column({ name: 'max_satellites', type: 'int', nullable: true })
  maxSatellites: number;

  @Column({ name: 'min_satellites', type: 'int', nullable: true })
  minSatellites: number;

  @Column({ name: 'standard_dev_satellites', type: 'float', nullable: true })
  standardDevSatellites: number;

  @Column({ name: 'unique_satellites', type: 'int', nullable: true })
  uniqueSatellites: number;

  @Column({ name: 'satellite_details', type: 'text', nullable: true })
  satelliteDetails: string;

  @Column({ name: 'observables', type: 'simple-json', nullable: true })
  observables: any;

  @Column({ name: 'total_observations', type: 'int', nullable: true })
  totalObservations: number;

  @Column({ name: 'station1_id', nullable: true })
  station1Id: string;

  @Column({ name: 'station1_name', nullable: true })
  station1Name: string;

  @Column({ name: 'station1_code', nullable: true })
  station1Code: string;

  @Column({ name: 'station2_id', nullable: true })
  station2Id: string;

  @Column({ name: 'station2_name', nullable: true })
  station2Name: string;

  @Column({ name: 'station2_code', nullable: true })
  station2Code: string;

  @Column({ name: 'distance1', type: 'float', nullable: true })
  distance1: number;

  @Column({ name: 'distance2', type: 'float', nullable: true })
  distance2: number;

  @Column({ name: 'used_distance', type: 'float', nullable: true })
  usedDistance: number;

  @Column({ name: 'used_station_id', nullable: true })
  usedStationId: string;

  @Column({ name: 'used_station_name', nullable: true })
  usedStationName: string;

  @Column({ name: 'required_time', type: 'int', nullable: true })
  requiredTime: number;

  @Column({ name: 'complies', nullable: true })
  complies: boolean;

  @Column({ name: 'quality_index', type: 'int', nullable: true })
  qualityIndex: number;

  @Column({ name: 'quality_label', nullable: true })
  qualityLabel: string;

  @Column({ name: 'quality_breakdown', type: 'text', nullable: true })
  qualityBreakdown: string;

  @Column({ name: 'technical_concept', type: 'text', nullable: true })
  technicalConcept: string;

  @Column({ name: 'recommendations', type: 'text', nullable: true })
  recommendations: string;

  @Column({ name: 'network_type', nullable: true })
  networkType: string;

  @Column({ name: 'is_dual_frequency', nullable: true })
  isDualFrequency: boolean;

  @Column({ name: 'method', nullable: true })
  method: string;

  @Column({ name: 'processing_time_ms', type: 'int', nullable: true })
  processingTimeMs: number;

  @Column({ name: 'epochs_analyzed', type: 'int', nullable: true })
  epochsAnalyzed: number;

  @Column({ name: 'receiver_catalog_info', type: 'text', nullable: true })
  receiverCatalogInfo: string;

  @Column({ name: 'antenna_catalog_info', type: 'text', nullable: true })
  antennaCatalogInfo: string;

  @Column({ name: 'frequency_detected', nullable: true })
  frequencyDetected: string;

  @Column({ name: 'signal_unit', nullable: true })
  signalUnit: string;

  @Column({ name: 'leap_seconds', type: 'int', nullable: true })
  leapSeconds: number;

  @Column({ name: 'glonass_slot', nullable: true })
  glonassSlot: string;

  @Column({ name: 'comments', type: 'text', nullable: true })
  comments: string;

  @Column({ name: 'continuity_label', nullable: true })
  continuityLabel: string;

  @Column({ name: 'validation_score', type: 'int', nullable: true })
  validationScore: number;

  @Column({ name: 'validation_issues', type: 'text', nullable: true })
  validationIssues: string;

  @Column({ name: 'expected_epochs', type: 'int', nullable: true })
  expectedEpochs: number;

  @Column({ name: 'total_file_lines', type: 'int', nullable: true })
  totalFileLines: number;

  @Column({ name: 'header_consistent', nullable: true })
  headerConsistent: boolean;
}
