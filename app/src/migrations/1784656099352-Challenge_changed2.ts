import { MigrationInterface, QueryRunner } from "typeorm";

export class ChallengeChanged21784656099352 implements MigrationInterface {
    name = 'ChallengeChanged21784656099352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "challenge_group_teams" ("challengeGroupId" uuid NOT NULL, "teamId" uuid NOT NULL, CONSTRAINT "PK_32e5227663074046502e1157400" PRIMARY KEY ("challengeGroupId", "teamId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8ece2b4ebdb8a9a7c20a3083d8" ON "challenge_group_teams"  ("challengeGroupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd7db45ce5059c889df045663d" ON "challenge_group_teams"  ("teamId") `);
        await queryRunner.query(`ALTER TABLE "challenge_group_teams" ADD CONSTRAINT "FK_8ece2b4ebdb8a9a7c20a3083d80" FOREIGN KEY ("challengeGroupId") REFERENCES "challenge_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "challenge_group_teams" ADD CONSTRAINT "FK_bd7db45ce5059c889df045663da" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "challenge_group_teams" DROP CONSTRAINT "FK_bd7db45ce5059c889df045663da"`);
        await queryRunner.query(`ALTER TABLE "challenge_group_teams" DROP CONSTRAINT "FK_8ece2b4ebdb8a9a7c20a3083d80"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd7db45ce5059c889df045663d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ece2b4ebdb8a9a7c20a3083d8"`);
        await queryRunner.query(`DROP TABLE "challenge_group_teams"`);
    }

}
