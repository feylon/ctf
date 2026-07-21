import { MigrationInterface, QueryRunner } from "typeorm";

export class FileVaFolderEntityQushildi1784658595311 implements MigrationInterface {
    name = 'FileVaFolderEntityQushildi1784658595311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "folders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "parentId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" uuid, CONSTRAINT "PK_8578bd31b0e7f6d6c2480dbbca8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying NOT NULL, "fileName" character varying NOT NULL, "filePath" character varying NOT NULL, "mimetype" character varying NOT NULL, "size" bigint NOT NULL, "url" character varying NOT NULL, "folderId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "uploadedById" uuid, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_1be2fce400dcc657602d336f23f" FOREIGN KEY ("parentId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "folders" ADD CONSTRAINT "FK_a579efd05db6a43ad3b6475c7ac" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_24dfe39188240d442f380dd8c04" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_a525d85f0ac59aa9a971825e1af" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_a525d85f0ac59aa9a971825e1af"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_24dfe39188240d442f380dd8c04"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_a579efd05db6a43ad3b6475c7ac"`);
        await queryRunner.query(`ALTER TABLE "folders" DROP CONSTRAINT "FK_1be2fce400dcc657602d336f23f"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TABLE "folders"`);
    }

}
