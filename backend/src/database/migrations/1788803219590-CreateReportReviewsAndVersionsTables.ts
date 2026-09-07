import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReportReviewsAndVersionsTables1788803219590 implements MigrationInterface {
    name = 'CreateReportReviewsAndVersionsTables1788803219590'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`report_reviews\` (\`id\` varchar(36) NOT NULL, \`action\` enum ('APPROVED', 'REQUEST_CHANGES') NOT NULL, \`comment\` text NULL, \`reportVersion\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`reportId\` varchar(36) NOT NULL, \`reviewerId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`report_versions\` (\`id\` varchar(36) NOT NULL, \`versionNumber\` int NOT NULL, \`snapshot\` json NOT NULL, \`submittedAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`reportId\` varchar(36) NOT NULL, UNIQUE INDEX \`UQ_report_version\` (\`reportId\`, \`versionNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`report_reviews\` ADD CONSTRAINT \`FK_5e6997084f4a86afc3ab9aa40f7\` FOREIGN KEY (\`reportId\`) REFERENCES \`weekly_reports\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report_reviews\` ADD CONSTRAINT \`FK_6d2bffa2149ad3857c20676cc64\` FOREIGN KEY (\`reviewerId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report_versions\` ADD CONSTRAINT \`FK_bd5170617661cc77b5c0fa3e6ba\` FOREIGN KEY (\`reportId\`) REFERENCES \`weekly_reports\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`report_versions\` DROP FOREIGN KEY \`FK_bd5170617661cc77b5c0fa3e6ba\``);
        await queryRunner.query(`ALTER TABLE \`report_reviews\` DROP FOREIGN KEY \`FK_6d2bffa2149ad3857c20676cc64\``);
        await queryRunner.query(`ALTER TABLE \`report_reviews\` DROP FOREIGN KEY \`FK_5e6997084f4a86afc3ab9aa40f7\``);
        await queryRunner.query(`DROP INDEX \`UQ_report_version\` ON \`report_versions\``);
        await queryRunner.query(`DROP TABLE \`report_versions\``);
        await queryRunner.query(`DROP TABLE \`report_reviews\``);
    }

}
