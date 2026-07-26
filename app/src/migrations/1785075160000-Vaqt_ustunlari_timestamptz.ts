import { MigrationInterface, QueryRunner } from "typeorm";

// Vaqt zonasisiz saqlangan ustunlar timestamptz ga o'tkaziladi.
// Mavjud qiymatlar PostgreSQL server vaqti (UTC) bo'yicha yozilgan deb hisoblanadi.
const COLUMNS: [string, string][] = [
    ['files', 'createdAt'],
    ['folders', 'createdAt'],
    ['news', 'createdAt'],
    ['participations', 'joinedAt'],
    ['problem_submissions', 'submittedAt'],
    ['problems', 'createdAt'],
    ['problems', 'updatedAt'],
    ['tournament_settings', 'updatedAt'],
];

export class VaqtUstunlariTimestamptz1785075160000 implements MigrationInterface {
    name = 'VaqtUstunlariTimestamptz1785075160000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const [table, column] of COLUMNS) {
            await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP WITH TIME ZONE USING "${column}" AT TIME ZONE 'UTC'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const [table, column] of COLUMNS) {
            await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP USING "${column}" AT TIME ZONE 'UTC'`);
        }
    }

}
