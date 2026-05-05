-- AlterTable
ALTER TABLE `NFCCardIssuance` MODIFY `calendar_url` TEXT NULL,
    MODIFY `location_url` TEXT NULL,
    MODIFY `website_url` TEXT NULL,
    MODIFY `google_calendar_link` TEXT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `reset_otp` VARCHAR(191) NULL,
    ADD COLUMN `reset_otp_expiry` DATETIME(3) NULL;
