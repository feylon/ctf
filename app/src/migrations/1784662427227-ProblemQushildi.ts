import { MigrationInterface, QueryRunner } from "typeorm";

export class ProblemQushildi1784662427227 implements MigrationInterface {
    name = 'ProblemQushildi1784662427227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "problems" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(20) NOT NULL, "title" character varying(255) NOT NULL, "description" text NOT NULL, "flagHash" character varying, "difficulty" integer NOT NULL DEFAULT '0', "category" character varying(100) NOT NULL, "rating" double precision NOT NULL DEFAULT '0', "points" integer NOT NULL DEFAULT '0', "solvedCount" integer NOT NULL DEFAULT '0', "totalTries" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_92cf8d938405ef6369f311f0c48" UNIQUE ("code"), CONSTRAINT "PK_b3994afba6ab64a42cda1ccaeff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "problem_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying(50) NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "submittedAnswer" character varying(255), "submittedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "problemId" uuid, CONSTRAINT "PK_5d4ccc2ee1566d691694cf97f64" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "problem_submissions" ADD CONSTRAINT "FK_5c4b95022158f02acdaf1a26399" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "problem_submissions" ADD CONSTRAINT "FK_fe8bb9cf0eb002a84c2ad385eb5" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "problem_submissions" DROP CONSTRAINT "FK_fe8bb9cf0eb002a84c2ad385eb5"`);
        await queryRunner.query(`ALTER TABLE "problem_submissions" DROP CONSTRAINT "FK_5c4b95022158f02acdaf1a26399"`);
        await queryRunner.query(`DROP TABLE "problem_submissions"`);
        await queryRunner.query(`DROP TABLE "problems"`);
    }

}
