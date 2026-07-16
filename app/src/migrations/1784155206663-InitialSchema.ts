import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784155206663 implements MigrationInterface {
    name = 'InitialSchema1784155206663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
    }

}
