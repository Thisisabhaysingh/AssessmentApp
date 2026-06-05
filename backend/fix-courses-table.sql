-- Add missing columns to courses table
ALTER TABLE courses ADD COLUMN duration INT DEFAULT 0;
ALTER TABLE courses ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'draft';

-- Add timestamps if they don't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
