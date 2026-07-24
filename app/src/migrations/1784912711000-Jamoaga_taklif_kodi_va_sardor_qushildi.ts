import { MigrationInterface, QueryRunner } from "typeorm";

export class JamoagaTaklifKodiVaSardorQushildi1784912711000 implements MigrationInterface {
    name = 'JamoagaTaklifKodiVaSardorQushildi1784912711000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Mavjud jamoalar uchun taklif kodini avval to'ldirib, keyin NOT NULL qilamiz
        await queryRunner.query(`ALTER TABLE "teams" ADD "inviteCode" character varying(16)`);
        await queryRunner.query(`UPDATE "teams" SET "inviteCode" = upper(substr(md5(random()::text || "id"::text), 1, 10))`);
        await queryRunner.query(`ALTER TABLE "teams" ALTER COLUMN "inviteCode" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "UQ_f2eda092e8b2bfd1aa6161175d8" UNIQUE ("inviteCode")`);

        await queryRunner.query(`ALTER TABLE "teams" ADD "captainId" uuid`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_c865ec19ec98fc763b1b709eaf2" FOREIGN KEY ("captainId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        // Sardor sifatida eng birinchi qo'shilgan a'zo belgilanadi
        await queryRunner.query(`UPDATE "teams" t SET "captainId" = (SELECT u."id" FROM "users" u WHERE u."teamId" = t."id" ORDER BY u."createdAt" ASC LIMIT 1)`);

        await queryRunner.query(`ALTER TABLE "submissions" ADD "pointsAwarded" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "pointsAwarded"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_c865ec19ec98fc763b1b709eaf2"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "captainId"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "UQ_f2eda092e8b2bfd1aa6161175d8"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "inviteCode"`);
    }

}
