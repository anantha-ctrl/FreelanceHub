-- ============================================================================
--  Car Hive Freelancer Platform — Database Schema (MySQL 8 / MariaDB)
-- ----------------------------------------------------------------------------
--  This file documents the Car Hive domain tables. The application uses
--  Sequelize and auto-creates these tables on first boot (sequelize.sync()),
--  so running this script is OPTIONAL — it is provided as a reference and for
--  manual/CI provisioning. Engine: InnoDB, charset utf8mb4.
--
--  Entity overview & relationships:
--    users (1) ───< advertisements (M)        a user owns many ads
--    advertisements (1) ─── (1) new_vehicle_details   when vehicleType='new'
--    advertisements (1) ─── (1) used_vehicle_details  when vehicleType='used'
--    users (1) ───< daily_reports (M)
--    users (1) ───< file_requests (M)
--    users (1) ───< notifications (M)
--    users (1) ───< announcements (M)          (createdBy author)
--    users (1) ───< audit_logs (M)             (activity logs)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `freehub`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `freehub`;

-- ─── USERS ───────────────────────────────────────────────────────────────
-- Car Hive adds: username (unique), dob, address to the base account table.
CREATE TABLE IF NOT EXISTS `users` (
  `id`            CHAR(36)      NOT NULL,
  `name`          VARCHAR(50)   NOT NULL,
  `email`         VARCHAR(100)  NOT NULL,
  `mobile`        VARCHAR(30)   NOT NULL,
  `username`      VARCHAR(50)   NULL,
  `dob`           DATE          NULL,
  `address`       VARCHAR(255)  NULL DEFAULT '',
  `password`      VARCHAR(255)  NOT NULL,
  `role`          ENUM('user','admin') NOT NULL DEFAULT 'user',
  `profileImage`  VARCHAR(255)  NULL,
  `bio`           VARCHAR(300)  NOT NULL DEFAULT '',
  `isBlocked`     TINYINT(1)    NOT NULL DEFAULT 0,
  `isOnline`      TINYINT(1)    NOT NULL DEFAULT 0,
  `lastSeen`      DATETIME      NULL,
  `theme`         VARCHAR(10)   NOT NULL DEFAULT 'dark',
  `createdAt`     DATETIME      NOT NULL,
  `updatedAt`     DATETIME      NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`),
  UNIQUE KEY `uniq_users_username` (`username`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ADVERTISEMENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `advertisements` (
  `id`            CHAR(36)      NOT NULL,
  `adId`          VARCHAR(30)   NOT NULL,           -- e.g. CH-AD-00001
  `batchNumber`   VARCHAR(50)   NOT NULL,
  `carTitle`      VARCHAR(150)  NOT NULL,
  `username`      VARCHAR(50)   NOT NULL,
  `vehicleType`   ENUM('new','used') NOT NULL,
  `status`        ENUM('active','pending','sold','archived') NOT NULL DEFAULT 'active',
  `confirmed`     TINYINT(1)    NOT NULL DEFAULT 0,
  `userId`        CHAR(36)      NOT NULL,
  `createdAt`     DATETIME      NOT NULL,
  `updatedAt`     DATETIME      NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ad_adId` (`adId`),
  KEY `idx_ad_batch` (`batchNumber`),
  KEY `idx_ad_type` (`vehicleType`),
  KEY `idx_ad_user` (`userId`),
  KEY `idx_ad_status` (`status`),
  CONSTRAINT `fk_ad_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── NEW VEHICLE DETAILS (1:1 with advertisements where vehicleType='new') ─
CREATE TABLE IF NOT EXISTS `new_vehicle_details` (
  `id`                  CHAR(36)     NOT NULL,
  `advertisementId`     CHAR(36)     NOT NULL,
  `sellerName`          VARCHAR(120) NULL,
  `address`             VARCHAR(255) NULL,
  `city`                VARCHAR(80)  NULL,
  `state`               VARCHAR(80)  NULL,
  `pincode`             VARCHAR(15)  NULL,
  `fuelType`            VARCHAR(40)  NULL,
  `yearOfProduction`    VARCHAR(10)  NULL,
  `yearOfManufacturing` VARCHAR(10)  NULL,
  `bodyType`            VARCHAR(60)  NULL,
  `mileageKm`           VARCHAR(40)  NULL,
  `transmissionType`    VARCHAR(40)  NULL,
  `engineCapacityCc`    VARCHAR(40)  NULL,
  `vehicleColor`        VARCHAR(40)  NULL,
  `colorCode`           VARCHAR(40)  NULL,
  `chassisNumber`       VARCHAR(60)  NULL,
  `fuelEfficiency`      VARCHAR(60)  NULL,
  `roadTaxPaid`         VARCHAR(20)  NULL,
  `askingPrice`         VARCHAR(40)  NULL,
  `priceNegotiable`     TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt`           DATETIME     NOT NULL,
  `updatedAt`           DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_newdet_ad` (`advertisementId`),
  CONSTRAINT `fk_newdet_ad` FOREIGN KEY (`advertisementId`) REFERENCES `advertisements` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── USED VEHICLE DETAILS (1:1 where vehicleType='used') ──────────────────
CREATE TABLE IF NOT EXISTS `used_vehicle_details` (
  `id`                   CHAR(36)     NOT NULL,
  `advertisementId`      CHAR(36)     NOT NULL,
  `carCode`              VARCHAR(60)  NULL,
  `sellerName`           VARCHAR(120) NULL,
  `address`              VARCHAR(255) NULL,
  `city`                 VARCHAR(80)  NULL,
  `state`                VARCHAR(80)  NULL,
  `pincode`              VARCHAR(15)  NULL,
  `contactNumber`        VARCHAR(30)  NULL,
  `emailAddress`         VARCHAR(120) NULL,
  `fuelType`             VARCHAR(40)  NULL,
  `vehicleCondition`     VARCHAR(60)  NULL,
  `yearOfProduction`     VARCHAR(10)  NULL,
  `yearOfManufacturing`  VARCHAR(10)  NULL,
  `bodyType`             VARCHAR(60)  NULL,
  `mileage`              VARCHAR(40)  NULL,
  `transmissionType`     VARCHAR(40)  NULL,
  `engineCapacity`       VARCHAR(40)  NULL,
  `vehicleColor`         VARCHAR(40)  NULL,
  `colorCode`            VARCHAR(40)  NULL,
  `numberOfOwners`       VARCHAR(20)  NULL,
  `registrationCity`     VARCHAR(80)  NULL,
  `registrationNumber`   VARCHAR(40)  NULL,
  `vinNumber`            VARCHAR(60)  NULL,
  `chassisNumber`        VARCHAR(60)  NULL,
  `insuranceValidity`    VARCHAR(40)  NULL,
  `rcStatus`             VARCHAR(40)  NULL,
  `warrantyStatus`       VARCHAR(40)  NULL,
  `serviceHistoryStatus` VARCHAR(40)  NULL,
  `lastServiceDate`      VARCHAR(40)  NULL,
  `serviceCenterHistory` TEXT         NULL,
  `featureHighlights`    TEXT         NULL,
  `carAccessories`       TEXT         NULL,
  `fuelEfficiency`       VARCHAR(60)  NULL,
  `tyreCondition`        VARCHAR(60)  NULL,
  `interiorCondition`    VARCHAR(60)  NULL,
  `exteriorCondition`    VARCHAR(60)  NULL,
  `roadTaxPaid`          VARCHAR(20)  NULL,
  `loanStatus`           VARCHAR(40)  NULL,
  `askingPrice`          VARCHAR(40)  NULL,
  `financialStatus`      VARCHAR(60)  NULL,
  `vehicleDescription`   TEXT         NULL,
  `createdAt`            DATETIME     NOT NULL,
  `updatedAt`            DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_useddet_ad` (`advertisementId`),
  CONSTRAINT `fk_useddet_ad` FOREIGN KEY (`advertisementId`) REFERENCES `advertisements` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── DAILY REPORTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `daily_reports` (
  `id`                    CHAR(36)    NOT NULL,
  `userId`                CHAR(36)    NOT NULL,
  `reportDate`            DATE        NOT NULL,
  `username`              VARCHAR(50) NOT NULL,
  `email`                 VARCHAR(120) NULL,
  `workingFileId`         VARCHAR(40) NOT NULL,
  `formsCompletedToday`   INT         NOT NULL DEFAULT 0,
  `formsCompletedTillNow` INT         NOT NULL DEFAULT 0,
  `createdAt`             DATETIME    NOT NULL,
  `updatedAt`             DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_report_user` (`userId`),
  KEY `idx_report_date` (`reportDate`),
  CONSTRAINT `fk_report_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── FILE REQUESTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `file_requests` (
  `id`                 CHAR(36)    NOT NULL,
  `userId`             CHAR(36)    NOT NULL,
  `username`           VARCHAR(50) NOT NULL,
  `oldFileId`          VARCHAR(40) NULL,
  `requestedFileRange` VARCHAR(40) NOT NULL,    -- e.g. 151-300
  `lastCompletionDate` DATE        NULL,
  `status`             ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `createdAt`          DATETIME    NOT NULL,
  `updatedAt`          DATETIME    NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_freq_user` (`userId`),
  KEY `idx_freq_status` (`status`),
  CONSTRAINT `fk_freq_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── NOTIFICATIONS (in-app center; mirrors email/SMS/WhatsApp dispatch) ────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`        CHAR(36)     NOT NULL,
  `userId`    CHAR(36)     NOT NULL,
  `title`     VARCHAR(150) NOT NULL,
  `message`   TEXT         NOT NULL,
  `type`      ENUM('info','success','warning','ad','report','file','announcement','system') NOT NULL DEFAULT 'info',
  `channels`  VARCHAR(120) NOT NULL DEFAULT 'in-app',
  `isRead`    TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt` DATETIME     NOT NULL,
  `updatedAt` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`userId`),
  KEY `idx_notif_read` (`isRead`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `announcements` (
  `id`        CHAR(36)     NOT NULL,
  `title`     VARCHAR(150) NOT NULL,
  `body`      TEXT         NOT NULL,
  `priority`  ENUM('low','normal','high') NOT NULL DEFAULT 'normal',
  `isActive`  TINYINT(1)   NOT NULL DEFAULT 1,
  `createdBy` CHAR(36)     NULL,
  `createdAt` DATETIME     NOT NULL,
  `updatedAt` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ann_active` (`isActive`),
  CONSTRAINT `fk_ann_author` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ACTIVITY / AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`               CHAR(36)     NOT NULL,
  `action`           VARCHAR(50)  NOT NULL,
  `details`          TEXT         NOT NULL,
  `ipAddress`        VARCHAR(255) NULL,
  `userId`           CHAR(36)     NULL,
  `executionTimeMs`  INT          NULL,
  `createdAt`        DATETIME     NOT NULL,
  `updatedAt`        DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
