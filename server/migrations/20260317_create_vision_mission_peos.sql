-- Create table for Vision, Mission and PEOs data
-- This table stores the institutional/departmental vision, mission, and program educational objectives

CREATE TABLE IF NOT EXISTS `vision_mission_peos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `department_name` varchar(150) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `criterion_name` varchar(100) COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'e.g., Vision, Mission, PEOs, Process of Defining, Dissemination',
  `content_text` longtext COLLATE utf8mb4_0900_ai_ci COMMENT 'Text content of the criterion',
  `image_url` varchar(500) COLLATE utf8mb4_0900_ai_ci COMMENT 'Path or URL to the uploaded image',
  `image_alt_text` varchar(255) COLLATE utf8mb4_0900_ai_ci COMMENT 'Alt text for accessibility',
  `academic_year` varchar(9) COLLATE utf8mb4_0900_ai_ci COMMENT 'Academic year in format YYYY-YY',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(150) COLLATE utf8mb4_0900_ai_ci COMMENT 'User who created this entry',
  `updated_by` varchar(150) COLLATE utf8mb4_0900_ai_ci COMMENT 'User who last updated this entry',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_program_id` (`program_id`),
  KEY `idx_department_name` (`department_name`),
  KEY `idx_criterion_name` (`criterion_name`),
  KEY `idx_academic_year` (`academic_year`),
  CONSTRAINT `fk_vision_mission_peos_program` FOREIGN KEY (`program_id`) REFERENCES `all_program` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=1;

-- Create index for efficient filtering by department and criterion
CREATE INDEX idx_department_criterion ON vision_mission_peos (department_name, criterion_name);
