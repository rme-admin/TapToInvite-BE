-- AlterTable
ALTER TABLE `SiteConfiguration` ADD COLUMN `updated_at` DATETIME(3) NULL,
    ADD COLUMN `updated_by_name` VARCHAR(191) NULL;
