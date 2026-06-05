-- Migration: Add deletedAt columns for soft delete functionality
-- Run this SQL to add the deletedAt columns to existing tables

-- Add deletedAt to users table
ALTER TABLE users ADD COLUMN deletedAt DATETIME NULL;

-- Add deletedAt to courses table
ALTER TABLE courses ADD COLUMN deletedAt DATETIME NULL;

-- Add deletedAt to assessments table
ALTER TABLE assessments ADD COLUMN deletedAt DATETIME NULL;
