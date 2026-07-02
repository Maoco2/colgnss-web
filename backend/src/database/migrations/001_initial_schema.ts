import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "postgis"');

    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'email', type: 'varchar', isUnique: true },
        { name: 'password', type: 'varchar' },
        { name: 'full_name', type: 'varchar' },
        { name: 'role', type: 'enum', enum: ['user', 'premium', 'admin'], default: "'user'" },
        { name: 'is_verified', type: 'boolean', default: false },
        { name: 'firebase_uid', type: 'varchar', isNullable: true },
        { name: 'avatar_url', type: 'varchar', isNullable: true },
        { name: 'company', type: 'varchar', isNullable: true },
        { name: 'phone', type: 'varchar', isNullable: true },
        { name: 'stripe_customer_id', type: 'varchar', isNullable: true },
        { name: 'premium_expires_at', type: 'timestamp', isNullable: true },
        { name: 'last_login_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await queryRunner.createTable(new Table({
      name: 'stations',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'code', type: 'varchar' },
        { name: 'name', type: 'varchar' },
        { name: 'type', type: 'enum', enum: ['active', 'passive'] },
        { name: 'department', type: 'varchar' },
        { name: 'municipality', type: 'varchar' },
        { name: 'latitude', type: 'double precision' },
        { name: 'longitude', type: 'double precision' },
        { name: 'height', type: 'double precision', isNullable: true },
        { name: 'geom', type: 'geometry(Point, 4326)' },
        { name: 'receiver_type', type: 'varchar', isNullable: true },
        { name: 'antenna_type', type: 'varchar', isNullable: true },
        { name: 'status', type: 'varchar', default: "'active'" },
        { name: 'influence_radius', type: 'double precision', isNullable: true },
        { name: 'material_type', type: 'varchar', isNullable: true },
        { name: 'monumentation_type', type: 'varchar', isNullable: true },
        { name: 'rinex_url', type: 'varchar', isNullable: true },
        { name: 'photos', type: 'jsonb', isNullable: true },
        { name: 'observations', type: 'text', isNullable: true },
        { name: 'admin_entity', type: 'varchar', isNullable: true },
        { name: 'divipola_code', type: 'varchar', isNullable: true },
        { name: 'installation_date', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await queryRunner.createIndex('stations', new TableIndex({
      name: 'idx_stations_geom',
      columnNames: ['geom'],
    }));
    await queryRunner.createIndex('stations', new TableIndex({
      name: 'idx_stations_type',
      columnNames: ['type'],
    }));
    await queryRunner.createIndex('stations', new TableIndex({
      name: 'idx_stations_department',
      columnNames: ['department'],
    }));

    await queryRunner.createTable(new Table({
      name: 'calculations',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'user_id', type: 'uuid' },
        { name: 'latitude', type: 'double precision' },
        { name: 'longitude', type: 'double precision' },
        { name: 'point_geom', type: 'geometry(Point, 4326)' },
        { name: 'network_type', type: 'varchar' },
        { name: 'station1_id', type: 'uuid', isNullable: true },
        { name: 'station2_id', type: 'uuid', isNullable: true },
        { name: 'station1_name', type: 'varchar', isNullable: true },
        { name: 'station2_name', type: 'varchar', isNullable: true },
        { name: 'distance1', type: 'double precision' },
        { name: 'distance2', type: 'double precision', isNullable: true },
        { name: 'tracking_time', type: 'integer' },
        { name: 'is_dual_frequency', type: 'boolean', default: true },
        { name: 'method', type: 'varchar' },
        { name: 'observations', type: 'text', isNullable: true },
        { name: 'is_premium', type: 'boolean', default: false },
        { name: 'comparison_data', type: 'jsonb', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await queryRunner.createIndex('calculations', new TableIndex({
      name: 'idx_calculations_user',
      columnNames: ['user_id'],
    }));

    await queryRunner.createTable(new Table({
      name: 'news',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'title', type: 'varchar' },
        { name: 'content', type: 'text' },
        { name: 'excerpt', type: 'varchar', isNullable: true },
        { name: 'image_url', type: 'varchar', isNullable: true },
        { name: 'author_id', type: 'uuid' },
        { name: 'is_published', type: 'boolean', default: false },
        { name: 'published_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }));

    await queryRunner.createTable(new Table({
      name: 'audit_logs',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'user_id', type: 'uuid', isNullable: true },
        { name: 'action', type: 'varchar' },
        { name: 'entity', type: 'varchar' },
        { name: 'entity_id', type: 'varchar', isNullable: true },
        { name: 'details', type: 'jsonb', isNullable: true },
        { name: 'ip_address', type: 'varchar', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
    await queryRunner.dropTable('news');
    await queryRunner.dropTable('calculations');
    await queryRunner.dropTable('stations');
    await queryRunner.dropTable('users');
  }
}
