-- ============================================
-- Inventory Management Database Initialization
-- This script runs automatically when the 
-- MySQL container starts for the first time.
-- ============================================

-- Ensure the database exists
CREATE DATABASE IF NOT EXISTS `inventorydb`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `inventorydb`;

-- Grant all privileges to root (for container access)
GRANT ALL PRIVILEGES ON `inventorydb`.* TO 'root'@'%';
FLUSH PRIVILEGES;
