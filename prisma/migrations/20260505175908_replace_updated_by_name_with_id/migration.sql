/*
  Warnings:

  - You are about to drop the column `updated_by_name` on the `SiteConfiguration` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `SiteConfiguration` DROP COLUMN `updated_by_name`,
    ADD COLUMN `updated_by_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `SiteConfiguration` ADD CONSTRAINT `SiteConfiguration_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
