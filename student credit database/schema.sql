-- phpMyAdmin SQL Dump for Students Care Model School
-- Database: `u451653929_StudentsCare`
-- Table structure for table `students`

CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique Student ID e.g. 2026101',
  `name` VARCHAR(150) NOT NULL COMMENT 'Student Full Name in English',
  `name_bn` VARCHAR(150) DEFAULT NULL COMMENT 'Student Full Name in Bengali',
  `roll` VARCHAR(20) DEFAULT NULL COMMENT 'Class Roll Number',
  `class_name` VARCHAR(50) NOT NULL COMMENT 'Class Name e.g. Class 6, Play',
  `section` VARCHAR(50) DEFAULT 'A' COMMENT 'Section e.g. A, B, Padma',
  `shift` VARCHAR(20) DEFAULT 'Morning' COMMENT 'Morning / Day',
  `group_name` VARCHAR(50) DEFAULT 'General' COMMENT 'Science / Arts / Commerce / General',
  `gender` ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
  `blood_group` VARCHAR(10) DEFAULT NULL COMMENT 'A+, B+, O+, AB+, etc.',
  `dob` DATE DEFAULT NULL COMMENT 'Date of Birth',
  `religion` VARCHAR(50) DEFAULT 'Islam',
  
  -- Guardian Details
  `father_name` VARCHAR(150) DEFAULT NULL,
  `father_occupation` VARCHAR(100) DEFAULT NULL,
  `mother_name` VARCHAR(150) DEFAULT NULL,
  `mother_occupation` VARCHAR(100) DEFAULT NULL,
  `guardian_name` VARCHAR(150) DEFAULT NULL,
  `guardian_phone` VARCHAR(20) NOT NULL COMMENT 'Primary contact number',
  `guardian_relation` VARCHAR(50) DEFAULT 'Father',
  
  -- Address Information
  `present_address` TEXT DEFAULT NULL,
  `permanent_address` TEXT DEFAULT NULL,
  
  -- Academic & System Meta
  `photo_url` TEXT DEFAULT NULL COMMENT 'Student Profile Picture URL',
  `session_year` VARCHAR(20) DEFAULT '2026',
  `admission_date` DATE DEFAULT NULL,
  `monthly_fee` DECIMAL(10,2) DEFAULT 0.00,
  `payment_status` ENUM('Paid', 'Due', 'Partial') DEFAULT 'Paid',
  `due_amount` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('Active', 'Inactive', 'Passed', 'Transferred') DEFAULT 'Active',
  
  -- Timestamps
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Indexes
CREATE INDEX idx_student_class_sec ON `students` (`class_name`, `section`);
CREATE INDEX idx_student_phone ON `students` (`guardian_phone`);
CREATE INDEX idx_student_session ON `students` (`session_year`);

-- Sample initial data
INSERT INTO `students` 
(`student_id`, `name`, `name_bn`, `roll`, `class_name`, `section`, `shift`, `gender`, `blood_group`, `father_name`, `mother_name`, `guardian_phone`, `present_address`, `session_year`, `status`) 
VALUES 
('2026101', 'Tanvir Rahman', 'তানভীর রহমান', '01', 'Class 6', 'A', 'Morning', 'Male', 'B+', 'Abdur Rahman', 'Taslima Begum', '01711000001', 'Dhaka, Bangladesh', '2026', 'Active'),
('2026102', 'Sumaiya Akhter', 'সুমাইয়া আক্তার', '02', 'Class 6', 'A', 'Morning', 'Female', 'O+', 'Kamal Hossain', 'Nasima Khatun', '01811000002', 'Dhaka, Bangladesh', '2026', 'Active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
