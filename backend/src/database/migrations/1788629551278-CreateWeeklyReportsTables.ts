import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWeeklyReportsTables1788629551278 implements MigrationInterface {
    name = 'CreateWeeklyReportsTables1788629551278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`report_tasks\` (\`id\` varchar(36) NOT NULL, \`taskName\` varchar(255) NOT NULL, \`priority\` enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL, \`plannedPercentage\` int NOT NULL, \`actualPercentage\` int NOT NULL, \`status\` enum ('TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED') NOT NULL, \`plannedMinutes\` int NOT NULL, \`spentMinutes\` int NOT NULL, \`deliverable\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`reportId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`next_week_tasks\` (\`id\` varchar(36) NOT NULL, \`taskName\` varchar(255) NOT NULL, \`reportId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`report_blockers\` (\`id\` varchar(36) NOT NULL, \`description\` text NOT NULL, \`isKeyIssue\` tinyint NOT NULL DEFAULT 0, \`reportId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`report_achievements\` (\`id\` varchar(36) NOT NULL, \`description\` text NOT NULL, \`isKeyAchievement\` tinyint NOT NULL DEFAULT 0, \`reportId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`weekly_reports\` (\`id\` varchar(36) NOT NULL, \`weekStart\` date NOT NULL, \`weekEnd\` date NOT NULL, \`status\` enum ('DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED') NOT NULL DEFAULT 'DRAFT', \`notes\` text NULL, \`submittedAt\` datetime NULL, \`approvedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NOT NULL, \`projectId\` varchar(36) NOT NULL, UNIQUE INDEX \`UQ_user_week_start\` (\`userId\`, \`weekStart\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`report_hour_breakdowns\` (\`id\` varchar(36) NOT NULL, \`taskType\` enum ('DEVELOPMENT', 'TESTING', 'MEETINGS', 'DOCUMENTATION', 'OTHER') NOT NULL, \`hours\` decimal(5,2) NOT NULL, \`reportId\` varchar(36) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`report_tasks\` ADD CONSTRAINT \`FK_4936814772dbbdb0d479745f7f1\` FOREIGN KEY (\`reportId\`) REFERENCES \`weekly_reports\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`next_week_tasks\` ADD CONSTRAINT \`FK_c625da4c2f82eb5fda7efa4fc12\` FOREIGN KEY (\`reportId\`) REFERENCES \`weekly_reports\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report_blockers\` ADD CONSTRAINT \`FK_3777240268c8761548c19780556\` FOREIGN KEY (\`reportId\`) REFERENCES \`weekly_reports\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report_achievements\` ADD CONSTRAINT \`FK_9de9358db0ea4b5163b5c7ba80d\` FOREIGN KEY (\`reportId\`) REFERENCES \`weekly_reports\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`weekly_reports\` ADD CONSTRAINT \`FK_db4a92d3e8960f7f593def3dcd8\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`weekly_reports\` ADD CONSTRAINT \`FK_5d18b069bffb210c9c8f1b67822\` FOREIGN KEY (\`projectId\`) REFERENCES \`projects\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`report_hour_breakdowns\` ADD CONSTRAINT \`FK_8169fe3d41813681eb2fc688bb2\` FOREIGN KEY (\`reportId\`) REFERENCES \`weekly_reports\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`report_hour_breakdowns\` DROP FOREIGN KEY \`FK_8169fe3d41813681eb2fc688bb2\``);
        await queryRunner.query(`ALTER TABLE \`weekly_reports\` DROP FOREIGN KEY \`FK_5d18b069bffb210c9c8f1b67822\``);
        await queryRunner.query(`ALTER TABLE \`weekly_reports\` DROP FOREIGN KEY \`FK_db4a92d3e8960f7f593def3dcd8\``);
        await queryRunner.query(`ALTER TABLE \`report_achievements\` DROP FOREIGN KEY \`FK_9de9358db0ea4b5163b5c7ba80d\``);
        await queryRunner.query(`ALTER TABLE \`report_blockers\` DROP FOREIGN KEY \`FK_3777240268c8761548c19780556\``);
        await queryRunner.query(`ALTER TABLE \`next_week_tasks\` DROP FOREIGN KEY \`FK_c625da4c2f82eb5fda7efa4fc12\``);
        await queryRunner.query(`ALTER TABLE \`report_tasks\` DROP FOREIGN KEY \`FK_4936814772dbbdb0d479745f7f1\``);
        await queryRunner.query(`DROP TABLE \`report_hour_breakdowns\``);
        await queryRunner.query(`DROP INDEX \`UQ_user_week_start\` ON \`weekly_reports\``);
        await queryRunner.query(`DROP TABLE \`weekly_reports\``);
        await queryRunner.query(`DROP TABLE \`report_achievements\``);
        await queryRunner.query(`DROP TABLE \`report_blockers\``);
        await queryRunner.query(`DROP TABLE \`next_week_tasks\``);
        await queryRunner.query(`DROP TABLE \`report_tasks\``);
    }

}
