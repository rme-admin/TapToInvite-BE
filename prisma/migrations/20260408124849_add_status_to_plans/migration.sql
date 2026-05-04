/*
  Warnings:

  - Added the required column `updated_at` to the `ProductPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ProductPlan` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;
