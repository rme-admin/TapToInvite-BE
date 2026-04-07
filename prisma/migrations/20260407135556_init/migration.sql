-- CreateTable
CREATE TABLE `ProductPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL,
    `is_recommended` BOOLEAN NOT NULL DEFAULT false,
    `min_nfc_qty` INTEGER NOT NULL DEFAULT 0,
    `min_normal_qty` INTEGER NOT NULL DEFAULT 0,
    `features` JSON NOT NULL,
    `icon_url` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon_url` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `EventCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NfcTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `images` JSON NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NfcTemplateCategory` (
    `nfc_template_id` INTEGER NOT NULL,
    `event_category_id` INTEGER NOT NULL,

    PRIMARY KEY (`nfc_template_id`, `event_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NormalCardTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `images` JSON NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NormalTemplateCategory` (
    `normal_template_id` INTEGER NOT NULL,
    `event_category_id` INTEGER NOT NULL,

    PRIMARY KEY (`normal_template_id`, `event_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `country_code` VARCHAR(191) NOT NULL DEFAULT '+91',
    `phone` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive', 'unverified') NOT NULL DEFAULT 'unverified',
    `refresh_token` VARCHAR(500) NULL,
    `verification_token` VARCHAR(191) NULL,
    `reset_token` VARCHAR(191) NULL,
    `reset_token_expiry` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `alt_phone` VARCHAR(191) NULL,
    `address_line_1` VARCHAR(191) NOT NULL,
    `address_line_2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `pincode` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'India',

    UNIQUE INDEX `UserDetails_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_number` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `plan_id` INTEGER NOT NULL,
    `event_category_id` INTEGER NOT NULL,
    `event_title` VARCHAR(191) NOT NULL,
    `event_date` DATETIME(3) NOT NULL,
    `digital_notes` TEXT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `advance_paid` DECIMAL(10, 2) NOT NULL,
    `balance_amount` DECIMAL(10, 2) NOT NULL,
    `advance_payment_method` VARCHAR(191) NULL,
    `balance_payment_method` VARCHAR(191) NULL,
    `transaction_id` VARCHAR(191) NULL,
    `payment_status` ENUM('Pending', 'Advance_Paid', 'Fully_Paid', 'Refunded') NOT NULL DEFAULT 'Pending',
    `order_status` ENUM('Pending', 'Team_Contacted', 'Designing', 'Printing', 'Shipped', 'Delivered') NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_order_number_key`(`order_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `item_type` ENUM('PLAN_BASE', 'NFC', 'NORMAL_CARD', 'WEBSITE_BASIC', 'WEBSITE_CUSTOM', 'QR_CODE', 'FRAME') NOT NULL,
    `reference_id` INTEGER NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `default_reminder_config` JSON NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subscription_plan_id` INTEGER NOT NULL,
    `order_id` INTEGER NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `expiry_date` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `reminder_config` JSON NOT NULL,
    `anniversary_date` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostPurchaseProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `images` JSON NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `stock_quantity` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteContent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `page_slug` VARCHAR(191) NOT NULL,
    `content_key` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `last_updated_by` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteConfiguration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `config_group` VARCHAR(191) NOT NULL,
    `config_key` VARCHAR(191) NOT NULL,
    `config_value` TEXT NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `SiteConfiguration_config_key_key`(`config_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Otp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `valid_till` DATETIME(3) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `code` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NfcTemplateCategory` ADD CONSTRAINT `NfcTemplateCategory_nfc_template_id_fkey` FOREIGN KEY (`nfc_template_id`) REFERENCES `NfcTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NfcTemplateCategory` ADD CONSTRAINT `NfcTemplateCategory_event_category_id_fkey` FOREIGN KEY (`event_category_id`) REFERENCES `EventCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NormalTemplateCategory` ADD CONSTRAINT `NormalTemplateCategory_normal_template_id_fkey` FOREIGN KEY (`normal_template_id`) REFERENCES `NormalCardTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NormalTemplateCategory` ADD CONSTRAINT `NormalTemplateCategory_event_category_id_fkey` FOREIGN KEY (`event_category_id`) REFERENCES `EventCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDetails` ADD CONSTRAINT `UserDetails_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `ProductPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_event_category_id_fkey` FOREIGN KEY (`event_category_id`) REFERENCES `EventCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_subscription_plan_id_fkey` FOREIGN KEY (`subscription_plan_id`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Otp` ADD CONSTRAINT `Otp_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
