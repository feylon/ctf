import { MigrationInterface, QueryRunner } from "typeorm";

export class ChallengeChanged1784652927798 implements MigrationInterface {
    name = 'ChallengeChanged1784652927798'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "challenges" ADD "startTime" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "challenges" ADD "endTime" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "challenges" ADD "allowedIpRange" character varying DEFAULT '*'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "challenges" DROP COLUMN "allowedIpRange"`);
        await queryRunner.query(`ALTER TABLE "challenges" DROP COLUMN "endTime"`);
        await queryRunner.query(`ALTER TABLE "challenges" DROP COLUMN "startTime"`);
    }

}
