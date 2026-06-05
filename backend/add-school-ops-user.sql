-- Add School Operations Manager user
-- Email: schoolops@example.com
-- Password: password123 (hashed with bcrypt)

INSERT INTO users (name, email, password, role, department, designation, status, createdAt, updatedAt) 
VALUES (
  'School Ops Sarah',
  'schoolops@example.com',
  '$2a$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQ',
  'school_ops_manager',
  'Operations',
  'School Operations Manager',
  'active',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  name = 'School Ops Sarah',
  role = 'school_ops_manager',
  department = 'Operations',
  designation = 'School Operations Manager',
  status = 'active',
  updatedAt = NOW();
