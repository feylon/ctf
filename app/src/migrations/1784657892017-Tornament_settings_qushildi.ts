import { MigrationInterface, QueryRunner } from "typeorm";

export class TornamentSettingsQushildi1784657892017 implements MigrationInterface {
    name = 'TornamentSettingsQushildi1784657892017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tournament_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isLive" boolean NOT NULL DEFAULT true, "globalStartTime" TIMESTAMP WITH TIME ZONE, "globalEndTime" TIMESTAMP WITH TIME ZONE, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4f82976e32daea25cc51ac28bdf" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tournament_settings"`);
    }

}
