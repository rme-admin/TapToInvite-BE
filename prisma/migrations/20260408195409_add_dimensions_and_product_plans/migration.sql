-- AlterTable
ALTER TABLE `NfcTemplate` ADD COLUMN `dimensions` VARCHAR(191) NULL DEFAULT '85 x 54mm';

-- AlterTable
ALTER TABLE `NormalCardTemplate` ADD COLUMN `dimensions` VARCHAR(191) NULL DEFAULT 'A4 (210 x 297mm)';
