CREATE DATABASE IF NOT EXISTS `freehub` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `freehub`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `profileImage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profileImagePublicId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `skills` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isBlocked` tinyint(1) DEFAULT '0',
  `isOnline` tinyint(1) DEFAULT '0',
  `lastSeen` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `mobile`, `username`, `dob`, `address`, `password`, `role`, `profileImage`, `profileImagePublicId`, `bio`, `skills`, `isBlocked`, `isOnline`, `lastSeen`, `createdAt`, `updatedAt`) VALUES
  ('6e0c997e-3d24-4c42-8d59-8e92a843fead', 'Admin', 'admin@freelancehub.com', '+1 000 000 0000', 'admin', NULL, '', 'Admin@123456', 'admin', NULL, NULL, '', '', 0, 0, NULL, '2026-06-02 07:41:12', '2026-06-02 07:41:12');

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('Web Development','Mobile','Design','AI/ML','DevOps','Marketing','Writing','Data Science','Other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `skills` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `budget` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagePublicId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvalStatus` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `rejectionReason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `likesCount` int DEFAULT '0',
  `commentsCount` int DEFAULT '0',
  `isDeleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `approvedBy` (`approvedBy`),
  KEY `posts_user_id` (`userId`),
  KEY `posts_approval_status` (`approvalStatus`),
  KEY `posts_category` (`category`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`approvedBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `login_logs`;
CREATE TABLE `login_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `loginTime` datetime NOT NULL,
  `logoutTime` datetime DEFAULT NULL,
  `sessionStatus` enum('active','expired','manual_logout') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `ipAddress` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unknown',
  `deviceInfo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unknown',
  `tokenId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `login_logs_user_id` (`userId`),
  KEY `login_logs_token_id` (`tokenId`),
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `postId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `likes_user_id_post_id` (`userId`,`postId`),
  KEY `postId` (`postId`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`postId`) REFERENCES `posts` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `postId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `comments_post_id` (`postId`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`postId`) REFERENCES `posts` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `blocked_users`;
CREATE TABLE `blocked_users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `blockedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `blockedReason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Violation of platform terms',
  `blockedAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  KEY `blockedBy` (`blockedBy`),
  CONSTRAINT `blocked_users_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `blocked_users_ibfk_2` FOREIGN KEY (`blockedBy`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `subject` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('open','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `support_tickets_user_id` (`userId`),
  CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `support_messages`;
CREATE TABLE `support_messages` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ticketId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `senderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `support_messages_ticket_id` (`ticketId`),
  KEY `support_messages_sender_id` (`senderId`),
  CONSTRAINT `support_messages_ibfk_1` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `support_messages_ibfk_2` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
--  CAR HIVE FREELANCER PLATFORM — DOMAIN TABLES
-- ============================================================================

DROP TABLE IF EXISTS `advertisements`;
CREATE TABLE `advertisements` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `adId` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batchNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `carTitle` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleType` enum('new','used') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','pending','sold','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `adId` (`adId`),
  KEY `advertisements_batch_number` (`batchNumber`),
  KEY `advertisements_vehicle_type` (`vehicleType`),
  KEY `advertisements_user_id` (`userId`),
  KEY `advertisements_status` (`status`),
  CONSTRAINT `advertisements_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `new_vehicle_details`;
CREATE TABLE `new_vehicle_details` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `advertisementId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sellerName` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuelType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `yearOfProduction` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `yearOfManufacturing` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bodyType` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mileageKm` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transmissionType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engineCapacityCc` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleColor` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `colorCode` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chassisNumber` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuelEfficiency` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roadTaxPaid` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `askingPrice` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priceNegotiable` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `advertisementId` (`advertisementId`),
  CONSTRAINT `new_vehicle_details_ibfk_1` FOREIGN KEY (`advertisementId`) REFERENCES `advertisements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `used_vehicle_details`;
CREATE TABLE `used_vehicle_details` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `advertisementId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `carCode` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sellerName` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactNumber` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emailAddress` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuelType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleCondition` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `yearOfProduction` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `yearOfManufacturing` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bodyType` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mileage` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transmissionType` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engineCapacity` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleColor` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `colorCode` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numberOfOwners` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registrationCity` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registrationNumber` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vinNumber` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chassisNumber` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insuranceValidity` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rcStatus` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warrantyStatus` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serviceHistoryStatus` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastServiceDate` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serviceCenterHistory` text COLLATE utf8mb4_unicode_ci,
  `featureHighlights` text COLLATE utf8mb4_unicode_ci,
  `carAccessories` text COLLATE utf8mb4_unicode_ci,
  `fuelEfficiency` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tyreCondition` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interiorCondition` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exteriorCondition` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roadTaxPaid` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loanStatus` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `askingPrice` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `financialStatus` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleDescription` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `advertisementId` (`advertisementId`),
  CONSTRAINT `used_vehicle_details_ibfk_1` FOREIGN KEY (`advertisementId`) REFERENCES `advertisements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `daily_reports`;
CREATE TABLE `daily_reports` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `reportDate` date NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `workingFileId` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `formsCompletedToday` int NOT NULL DEFAULT '0',
  `formsCompletedTillNow` int NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `daily_reports_user_id` (`userId`),
  KEY `daily_reports_report_date` (`reportDate`),
  CONSTRAINT `daily_reports_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `file_requests`;
CREATE TABLE `file_requests` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldFileId` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requestedFileRange` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastCompletionDate` date DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `file_requests_user_id` (`userId`),
  KEY `file_requests_status` (`status`),
  CONSTRAINT `file_requests_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('info','success','warning','ad','report','file','announcement','system') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `channels` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in-app',
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id` (`userId`),
  KEY `notifications_is_read` (`isRead`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','normal','high') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `announcements_is_active` (`isActive`),
  KEY `announcements_created_by` (`createdBy`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ipAddress` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `executionTimeMs` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_action` (`action`),
  KEY `audit_logs_user_id` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `announcements` (`id`, `title`, `body`, `priority`, `isActive`, `createdBy`, `createdAt`, `updatedAt`) VALUES
  ('a1111111-1111-4111-8111-111111111111', 'Welcome to Car Hive Freelancer Platform', 'Post vehicle advertisements, manage your listings, submit daily reports, and receive new file assignments — all from one dashboard.', 'high', 1, NULL, '2026-06-06 00:00:00', '2026-06-06 00:00:00'),
  ('a2222222-2222-4222-8222-222222222222', 'New File Assignment Ranges Available', 'File ranges from 1-150 up to 4951-5000 are now open for request. Submit a New File Request from your dashboard once your current file is complete.', 'normal', 1, NULL, '2026-06-06 00:00:00', '2026-06-06 00:00:00'),
  ('a3333333-3333-4333-8333-333333333333', 'Daily Report Reminder', 'Please remember to submit your daily report before end of day to keep your file assignments active.', 'normal', 1, NULL, '2026-06-06 00:00:00', '2026-06-06 00:00:00');

SET FOREIGN_KEY_CHECKS = 1;
