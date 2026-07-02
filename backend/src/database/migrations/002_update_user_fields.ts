import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUserFields1710000000000 implements MigrationInterface {
  name = 'UpdateUserFields1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({ name: 'profession', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'gender', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'is_active', type: 'boolean', default: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', ['profession', 'gender', 'is_active']);
  }
}