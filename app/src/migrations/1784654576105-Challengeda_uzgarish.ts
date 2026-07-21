import { MigrationInterface, QueryRunner } from "typeorm";

export class ChallengedaUzgarish1784654576105 implements MigrationInterface {
    name = 'ChallengedaUzgarish1784654576105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "challenges" ADD "initialPoints" integer NOT NULL DEFAULT '100'`);
        await queryRunner.query(`ALTER TABLE "challenges" ADD "minPoints" integer NOT NULL DEFAULT '10'`);
        await queryRunner.query(`ALTER TABLE "challenges" ADD "decrementStep" integer NOT NULL DEFAULT '10'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "challenges" DROP COLUMN "decrementStep"`);
        await queryRunner.query(`ALTER TABLE "challenges" DROP COLUMN "minPoints"`);
        await queryRunner.query(`ALTER TABLE "challenges" DROP COLUMN "initialPoints"`);
    }

}
