-- Add status and lastLogin columns to users table
ALTER TABLE users 
ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
ADD COLUMN lastLogin DATETIME NULL;
