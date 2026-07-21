import { MigrationInterface, QueryRunner } from "typeorm";

export class TeamQushildi1784653583900 implements MigrationInterface {
    name = 'TeamQushildi1784653583900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "score" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_48c0c32e6247a2de155baeaf980" UNIQUE ("name"), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "teamId" uuid`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "teamId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_d1803064187c8f38e57a9c4984c" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_90b8a1228c45f68b9a431cbd559" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_90b8a1228c45f68b9a431cbd559"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_d1803064187c8f38e57a9c4984c"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "teamId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "teamId"`);
        await queryRunner.query(`DROP TABLE "teams"`);
    }

}
