import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784153978176 implements MigrationInterface {
    name = 'InitialSchema1784153978176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "challenge_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_ff39e20c9cc3051a755851276c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "participations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "groupId" uuid, CONSTRAINT "PK_7aa63b8dcd3d6f8aef8a98bb14a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin', 'moderator')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "passwordHash" character varying NOT NULL, "email" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isDelete" boolean NOT NULL DEFAULT false, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "score" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isCorrect" boolean NOT NULL, "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid, "challengeId" uuid, CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "flagHash" character varying NOT NULL, "points" integer NOT NULL, "category" character varying NOT NULL, "attachmentPath" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "groupId" uuid, CONSTRAINT "PK_1e664e93171e20fe4d6125466af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "participations" ADD CONSTRAINT "FK_b96d1e076744a3081adbb791c48" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "participations" ADD CONSTRAINT "FK_e3c298ef46e69b4d7b478afccf2" FOREIGN KEY ("groupId") REFERENCES "challenge_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_eae888413ab8fc63cc48759d46a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_f42ebcea5910afdeb1b2ad8c83c" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "challenges" ADD CONSTRAINT "FK_9460a828cb9390482176352b664" FOREIGN KEY ("groupId") REFERENCES "challenge_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "challenges" DROP CONSTRAINT "FK_9460a828cb9390482176352b664"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_f42ebcea5910afdeb1b2ad8c83c"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_eae888413ab8fc63cc48759d46a"`);
        await queryRunner.query(`ALTER TABLE "participations" DROP CONSTRAINT "FK_e3c298ef46e69b4d7b478afccf2"`);
        await queryRunner.query(`ALTER TABLE "participations" DROP CONSTRAINT "FK_b96d1e076744a3081adbb791c48"`);
        await queryRunner.query(`DROP TABLE "challenges"`);
        await queryRunner.query(`DROP TABLE "submissions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "participations"`);
        await queryRunner.query(`DROP TABLE "challenge_groups"`);
    }

}
