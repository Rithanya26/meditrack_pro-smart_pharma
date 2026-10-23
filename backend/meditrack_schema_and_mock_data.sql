-- =====================================================================
-- MediTrack Pro — MySQL Database Schema and Mock Data
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `meditrack` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `meditrack`;

-- Disable foreign key checks for clean re-import
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `dispensing_items`;
DROP TABLE IF EXISTS `dispensing_transactions`;
DROP TABLE IF EXISTS `batches`;
DROP TABLE IF EXISTS `medicines`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Table: users
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: medicines (Brand Name & Generic Medicine separated, Category removed)
-- ---------------------------------------------------------------------
CREATE TABLE `medicines` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `brand_name` VARCHAR(255) NOT NULL,
  `generic_medicine` VARCHAR(255) NOT NULL,
  `manufacturer` VARCHAR(255) NOT NULL,
  `strength` VARCHAR(255) NOT NULL,
  `dosage_form` VARCHAR(255) NOT NULL,
  `minimum_stock` INT NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: batches
-- ---------------------------------------------------------------------
CREATE TABLE `batches` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `medicine_id` BIGINT NOT NULL,
  `batch_number` VARCHAR(255) NOT NULL UNIQUE,
  `manufacturing_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `supplier` VARCHAR(255) NOT NULL,
  `received_date` DATE NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_batches_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: dispensing_transactions
-- ---------------------------------------------------------------------
CREATE TABLE `dispensing_transactions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(255) NOT NULL,
  `patient_id` VARCHAR(255) NULL,
  `reference_number` VARCHAR(255) NULL,
  `pharmacist_id` BIGINT NOT NULL,
  `transaction_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_items` INT NOT NULL DEFAULT 0,
  `total_quantity` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dispensing_pharmacist` FOREIGN KEY (`pharmacist_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: dispensing_items
-- ---------------------------------------------------------------------
CREATE TABLE `dispensing_items` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` BIGINT NOT NULL,
  `medicine_id` BIGINT NOT NULL,
  `batch_id` BIGINT NOT NULL,
  `quantity` INT NOT NULL,
  `expiry_date_at_dispense` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dispensing_items_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `dispensing_transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dispensing_items_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  CONSTRAINT `fk_dispensing_items_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: audit_logs
-- ---------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NULL,
  `user_name` VARCHAR(255) NULL,
  `role` VARCHAR(50) NULL,
  `action` VARCHAR(255) NOT NULL,
  `entity` VARCHAR(255) NOT NULL,
  `entity_id` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- MOCK DATA INSERTION
-- =====================================================================

-- Users (Demo accounts: admin@meditrack.com / admin123, pharmacist@meditrack.com / pharma123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Latha (Admin)', 'admin@meditrack.com', '+1-555-0101', 'admin123', 'ADMIN', 'ACTIVE', '2025-01-15 09:00:00', '2025-01-15 09:00:00'),
(2, 'Kavitha (Pharmacist)', 'pharmacist@meditrack.com', '+1-555-0102', 'pharma123', 'PHARMACIST', 'ACTIVE', '2025-02-20 09:00:00', '2025-02-20 09:00:00'),
(3, 'Emily Rodriguez', 'emily@meditrack.com', '+1-555-0103', 'pharma123', 'PHARMACIST', 'ACTIVE', '2025-03-10 09:00:00', '2025-03-10 09:00:00'),
(4, 'Michael Chen', 'michael@meditrack.com', '+1-555-0104', 'pharma123', 'PHARMACIST', 'INACTIVE', '2025-04-05 09:00:00', '2025-04-05 09:00:00');

-- Medicines (Demonstrating separate Brand Names for identical Generic Medicines)
INSERT INTO `medicines` (`id`, `brand_name`, `generic_medicine`, `manufacturer`, `strength`, `dosage_form`, `minimum_stock`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Dolo 650', 'Paracetamol', 'Micro Labs', '650 mg', 'Tablet', 50, 'Fast-acting analgesic and antipyretic for fever and mild to moderate pain.', 'ACTIVE', '2025-01-20 10:00:00', '2025-01-20 10:00:00'),
(2, 'Calpol 650', 'Paracetamol', 'GlaxoSmithKline', '650 mg', 'Tablet', 60, 'Effective relief from fever and body aches with paracetamol formula.', 'ACTIVE', '2025-01-21 10:00:00', '2025-01-21 10:00:00'),
(3, 'Crocin 650', 'Paracetamol', 'GlaxoSmithKline', '650 mg', 'Tablet', 40, 'Fast-release paracetamol tablet for quick headache and fever relief.', 'ACTIVE', '2025-01-22 10:00:00', '2025-01-22 10:00:00'),
(4, 'PCM 500', 'Paracetamol', 'MediCorp Ltd', '500 mg', 'Tablet', 30, 'Standard clinical strength paracetamol tablet.', 'ACTIVE', '2025-01-23 10:00:00', '2025-01-23 10:00:00'),
(5, 'Brufen 400', 'Ibuprofen', 'Abbott', '400 mg', 'Tablet', 45, 'Non-steroidal anti-inflammatory drug (NSAID) for inflammation, arthritis, and pain.', 'ACTIVE', '2025-02-01 10:00:00', '2025-02-01 10:00:00'),
(6, 'Ibugesic 400', 'Ibuprofen', 'Cipla Ltd', '400 mg', 'Tablet', 40, 'Anti-inflammatory and analgesic tablet for dental pain, muscle pain, and joint pain.', 'ACTIVE', '2025-02-02 10:00:00', '2025-02-02 10:00:00'),
(7, 'Amoxil 500', 'Amoxicillin', 'PharmaHealth Inc', '500 mg', 'Capsule', 35, 'Broad-spectrum penicillin antibiotic for bacterial respiratory and systemic infections.', 'ACTIVE', '2025-02-05 10:00:00', '2025-02-05 10:00:00'),
(8, 'Zyrtec 10mg', 'Cetirizine', 'AllerCare Pharma', '10 mg', 'Tablet', 50, 'Non-drowsy second-generation antihistamine for seasonal allergic rhinitis.', 'ACTIVE', '2025-02-10 10:00:00', '2025-02-10 10:00:00'),
(9, 'Prilosec 20mg', 'Omeprazole', 'GastroPharma', '20 mg', 'Capsule', 35, 'Proton pump inhibitor reducing stomach acid production for GERD and ulcers.', 'ACTIVE', '2025-02-15 10:00:00', '2025-02-15 10:00:00'),
(10, 'Benadryl Cough', 'Dextromethorphan', 'RespiraCare', '100 ml', 'Syrup', 25, 'Oral cough suppressant syrup for acute dry cough symptoms.', 'ACTIVE', '2025-02-20 10:00:00', '2025-02-20 10:00:00'),
(11, 'Lantus SoloStar', 'Insulin Glargine', 'DiabetesCare Inc', '100 IU/ml', 'Injection', 20, 'Long-acting basal insulin analog injected once daily for glycemic control.', 'ACTIVE', '2025-02-25 10:00:00', '2025-02-25 10:00:00'),
(12, 'Cortizone 10', 'Hydrocortisone', 'DermaHealth', '1%', 'Cream', 25, 'Topical mild corticosteroid cream for eczema, dermatitis, and insect bite itch relief.', 'ACTIVE', '2025-03-01 10:00:00', '2025-03-01 10:00:00'),
(13, 'Bactroban Ointment', 'Mupirocin', 'DermaHealth', '2%', 'Ointment', 20, 'Topical antibiotic ointment indicated for primary and secondary skin infections.', 'ACTIVE', '2025-03-05 10:00:00', '2025-03-05 10:00:00'),
(14, 'Ventolin Inhaler', 'Salbutamol', 'RespiraCare', '100 mcg', 'Inhaler', 15, 'Metered-dose bronchodilator inhaler providing rapid relief of bronchospasm in asthma.', 'ACTIVE', '2025-03-10 10:00:00', '2025-03-10 10:00:00'),
(15, 'Ecotrin 75mg', 'Aspirin', 'MediCorp Ltd', '75 mg', 'Tablet', 80, 'Enteric-coated low-dose cardioprotective aspirin tablet.', 'ACTIVE', '2025-03-15 10:00:00', '2025-03-15 10:00:00'),
(16, 'Glucophage 500mg', 'Metformin', 'DiabetesCare Inc', '500 mg', 'Tablet', 50, 'First-line biguanide oral antihyperglycemic medication for type 2 diabetes mellitus.', 'ACTIVE', '2025-03-20 10:00:00', '2025-03-20 10:00:00'),
(17, 'Zithromax 250mg', 'Azithromycin', 'PharmaHealth Inc', '250 mg', 'Tablet', 40, 'Macrolide antibiotic active against practical respiratory and soft-tissue bacterial strains.', 'ACTIVE', '2025-03-25 10:00:00', '2025-03-25 10:00:00'),
(18, 'Prinivil 10mg', 'Lisinopril', 'CardioPharma', '10 mg', 'Tablet', 45, 'ACE inhibitor for the management of essential hypertension and heart failure.', 'ACTIVE', '2025-04-01 10:00:00', '2025-04-01 10:00:00'),
(19, 'Lipitor 20mg', 'Atorvastatin', 'CardioPharma', '20 mg', 'Tablet', 40, 'HMG-CoA reductase inhibitor (statin) for hypercholesterolemia management.', 'ACTIVE', '2025-04-05 10:00:00', '2025-04-05 10:00:00'),
(20, 'Rocephin 1g', 'Ceftriaxone', 'PharmaHealth Inc', '1 g', 'Injection', 30, 'Third-generation cephalosporin antibiotic injection for severe systemic infections.', 'ACTIVE', '2025-04-10 10:00:00', '2025-04-10 10:00:00');

-- Batches
INSERT INTO `batches` (`id`, `medicine_id`, `batch_number`, `manufacturing_date`, `expiry_date`, `supplier`, `received_date`, `quantity`, `created_at`, `updated_at`) VALUES
(1, 1, 'DLO2026A', '2025-06-15', '2027-06-14', 'Micro Supply Co', '2025-06-20', 500, '2025-06-20 10:00:00', '2025-06-20 10:00:00'),
(2, 1, 'DLO2026B', '2025-09-01', '2027-09-01', 'Micro Supply Co', '2025-09-10', 320, '2025-09-10 10:00:00', '2025-09-10 10:00:00'),
(3, 2, 'CAL2027A', '2025-10-01', '2027-10-01', 'GSK Logistics', '2025-10-10', 400, '2025-10-10 10:00:00', '2025-10-10 10:00:00'),
(4, 3, 'CRO2026A', '2025-08-01', '2026-09-13', 'GSK Logistics', '2025-08-10', 200, '2025-08-10 10:00:00', '2025-08-10 10:00:00'),
(5, 4, 'PCM2027A', '2025-10-01', '2027-10-01', 'MediSupply Co', '2025-10-10', 250, '2025-10-10 10:00:00', '2025-10-10 10:00:00'),
(6, 5, 'BRU2027A', '2025-11-01', '2027-11-01', 'Abbott Supply', '2025-11-10', 350, '2025-11-10 10:00:00', '2025-11-10 10:00:00'),
(7, 6, 'IBU2026A', '2025-07-01', '2026-08-15', 'Cipla Dist', '2025-07-10', 180, '2025-07-10 10:00:00', '2025-07-10 10:00:00'),
(8, 7, 'AMX2026A', '2025-05-01', '2026-10-01', 'PharmaDist Ltd', '2025-05-10', 220, '2025-05-10 10:00:00', '2025-05-10 10:00:00'),
(9, 8, 'ZYR2027A', '2025-12-01', '2027-12-01', 'AllerSupply', '2025-12-10', 300, '2025-12-10 10:00:00', '2025-12-10 10:00:00'),
(10, 9, 'OMP2026C', '2025-05-01', '2026-11-01', 'GastroSupply', '2025-05-10', 180, '2025-05-10 10:00:00', '2025-05-10 10:00:00'),
(11, 10, 'CGH2027A', '2025-11-01', '2027-05-01', 'RespiraDist', '2025-11-10', 90, '2025-11-10 10:00:00', '2025-11-10 10:00:00'),
(12, 11, 'INS2026A', '2025-04-01', '2026-04-01', 'DiabetesSupply', '2025-04-10', 60, '2025-04-10 10:00:00', '2025-04-10 10:00:00'),
(13, 12, 'HCC2027A', '2025-07-01', '2027-07-01', 'DermaSupply', '2025-07-10', 120, '2025-07-10 10:00:00', '2025-07-10 10:00:00'),
(14, 13, 'MUP2027A', '2025-10-01', '2027-10-01', 'DermaSupply', '2025-10-10', 80, '2025-10-10 10:00:00', '2025-10-10 10:00:00'),
(15, 14, 'SAL2026A', '2025-02-01', '2026-10-01', 'RespiraDist', '2025-02-10', 45, '2025-02-10 10:00:00', '2025-02-10 10:00:00'),
(16, 15, 'ASP2027A', '2025-12-01', '2027-12-01', 'MediSupply Co', '2025-12-10', 600, '2025-12-10 10:00:00', '2025-12-10 10:00:00'),
(17, 16, 'MET2026B', '2025-03-01', '2026-09-20', 'DiabetesSupply', '2025-03-10', 18, '2025-03-10 10:00:00', '2025-03-10 10:00:00'),
(18, 17, 'AZT2027A', '2025-09-01', '2027-09-01', 'PharmaDist Ltd', '2025-09-10', 250, '2025-09-10 10:00:00', '2025-09-10 10:00:00'),
(19, 18, 'LIS2027A', '2025-11-01', '2027-11-01', 'CardioSupply', '2025-11-10', 200, '2025-11-10 10:00:00', '2025-11-10 10:00:00'),
(20, 19, 'ATR2026B', '2025-01-01', '2026-12-15', 'CardioSupply', '2025-01-10', 12, '2025-01-10 10:00:00', '2025-01-10 10:00:00'),
(21, 20, 'CFT2027A', '2025-09-01', '2027-09-01', 'PharmaDist Ltd', '2025-09-10', 100, '2025-09-10 10:00:00', '2025-09-10 10:00:00');

-- Dispensing Transactions (Attributed to Pharmacist Kavitha, ID: 2)
INSERT INTO `dispensing_transactions` (`id`, `customer_name`, `customer_phone`, `patient_id`, `reference_number`, `pharmacist_id`, `transaction_date`, `total_items`, `total_quantity`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Robert Johnson', '+1-555-0211', 'PAT-1001', 'RX-2026-001', 2, '2026-08-26 09:15:00', 2, 30, 'COMPLETED', '2026-08-26 09:15:00', '2026-08-26 09:15:00'),
(2, 'Maria Garcia', '+1-555-0212', 'PAT-1002', 'RX-2026-002', 2, '2026-08-26 10:30:00', 1, 15, 'COMPLETED', '2026-08-26 10:30:00', '2026-08-26 10:30:00'),
(3, 'David Smith', '+1-555-0213', 'PAT-1003', 'RX-2026-003', 2, '2026-08-26 11:00:00', 1, 30, 'COMPLETED', '2026-08-26 11:00:00', '2026-08-26 11:00:00'),
(4, 'Anna Williams', '+1-555-0214', 'PAT-1004', 'RX-2026-004', 2, '2026-08-25 14:20:00', 2, 25, 'COMPLETED', '2026-08-25 14:20:00', '2026-08-25 14:20:00');

-- Dispensing Items (Connecting Transactions to Medicines and Batches)
INSERT INTO `dispensing_items` (`id`, `transaction_id`, `medicine_id`, `batch_id`, `quantity`, `expiry_date_at_dispense`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 20, '2027-06-14', '2026-08-26 09:15:00', '2026-08-26 09:15:00'),
(2, 1, 5, 6, 10, '2027-11-01', '2026-08-26 09:15:00', '2026-08-26 09:15:00'),
(3, 2, 2, 3, 15, '2027-10-01', '2026-08-26 10:30:00', '2026-08-26 10:30:00'),
(4, 3, 7, 8, 30, '2026-10-01', '2026-08-26 11:00:00', '2026-08-26 11:00:00'),
(5, 4, 1, 1, 10, '2027-06-14', '2026-08-25 14:20:00', '2026-08-25 14:20:00'),
(6, 4, 8, 9, 15, '2027-12-01', '2026-08-25 14:20:00', '2026-08-25 14:20:00');

-- Audit Logs
INSERT INTO `audit_logs` (`id`, `user_id`, `user_name`, `role`, `action`, `entity`, `entity_id`, `description`, `created_at`) VALUES
(1, 1, 'Latha (Admin)', 'ADMIN', 'LOGIN', 'USER', '1', 'Admin user logged in successfully', '2026-08-26 08:30:00'),
(2, 1, 'Latha (Admin)', 'ADMIN', 'MEDICINE_CREATED', 'MEDICINE', '1', 'Added new medicine Dolo 650 (Paracetamol 650 mg)', '2026-08-26 08:45:00'),
(3, 2, 'Kavitha (Pharmacist)', 'PHARMACIST', 'LOGIN', 'USER', '2', 'Pharmacist user logged in', '2026-08-26 09:00:00'),
(4, 2, 'Kavitha (Pharmacist)', 'PHARMACIST', 'MEDICINE_DISPENSED', 'DISPENSING_TRANSACTION', '1', 'Dispensed 20 units of Dolo 650 (Batch: DLO2026A) and 10 units of Brufen 400 (Batch: BRU2027A)', '2026-08-26 09:15:00'),
(5, 2, 'Kavitha (Pharmacist)', 'PHARMACIST', 'MEDICINE_DISPENSED', 'DISPENSING_TRANSACTION', '2', 'Dispensed 15 units of Calpol 650 (Batch: CAL2027A)', '2026-08-26 10:30:00'),
(6, 2, 'Kavitha (Pharmacist)', 'PHARMACIST', 'MEDICINE_DISPENSED', 'DISPENSING_TRANSACTION', '3', 'Dispensed 30 units of Amoxil 500 (Batch: AMX2026A)', '2026-08-26 11:00:00'),
(7, 2, 'Kavitha (Pharmacist)', 'PHARMACIST', 'MEDICINE_DISPENSED', 'DISPENSING_TRANSACTION', '4', 'Dispensed 10 units of Dolo 650 and 15 units of Zyrtec 10mg', '2026-08-25 14:20:00');
