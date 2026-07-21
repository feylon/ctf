import { MigrationInterface, QueryRunner } from "typeorm";

export class TeamgaISbannedQoshildi1784657677913 implements MigrationInterface {
    name = 'TeamgaISbannedQoshildi1784657677913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" ADD "isBanned" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "isBanned"`);
    }

}
