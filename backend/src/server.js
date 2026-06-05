import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { sequelize, User, Certificate, CertificateTemplate, Course } from './config/db.js';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/authRoutes.js';
import trainerRoutes from './routes/trainerRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import schoolOpsManagerRoutes from './routes/schoolOpsManagerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import trainerLevelRoutes from './routes/trainerLevelRoutes.js';
import certificateGenerationRoutes from './routes/certificateGenerationRoutes.js';
import trainerSettingsRoutes from './routes/trainerSettingsRoutes.js';
import trashRoutes from './routes/trashRoutes.js';
// import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/school-ops-manager', schoolOpsManagerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/trainer-level', trainerLevelRoutes);
app.use('/api/trainer-settings', trainerSettingsRoutes);
app.use('/api/certificate-generation', certificateGenerationRoutes);
app.use('/api/trash', trashRoutes);
// app.use('/api/users', userRoutes);

console.log('🚀 API Routes mounted:');
console.log('  - /api/auth/*');
console.log('  - /api/trainer/*');
console.log('  - /api/manager/*');
console.log('  - /api/school-ops-manager/*');
console.log('  - /api/admin/*');
console.log('  - /api/certificates/*');
console.log('  - /api/activities/*');
console.log('  - /api/public/*');
console.log('  - /api/trainer-level/*');
console.log('  - /api/certificate-generation/*');
console.log('  - /api/trash/*');

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync(); // Removed force: true to preserve data after initial setup
    console.log('Database synchronized. Models: User, Course, Certificate, CertificateTemplate');

    // Seed default users for demo if not present
    const count = await User.count();
    if (count === 0) {
      const pwd = await bcrypt.hash('password123', 10);
      await User.bulkCreate([
        { name: 'Admin User', email: 'admin@example.com', password: pwd, role: 'admin', department: 'HQ', designation: 'Administrator' },
        { name: 'Manager Mary', email: 'manager@example.com', password: pwd, role: 'manager', department: 'QA', designation: 'Technical Manager' },
        { name: 'School Ops Sarah', email: 'schoolops@example.com', password: pwd, role: 'school_ops_manager', department: 'Operations', designation: 'School Operations Manager' },
        { name: 'Trainer Tom', email: 'trainer@example.com', password: pwd, role: 'trainer', department: 'QA', designation: 'Senior Trainer' },
      ]);
      console.log('Seeded default users (password: password123)');
    }

    // Seed default courses if not present
    const courseCount = await Course.count();
    if (courseCount === 0) {
      await Course.bulkCreate([
        { name: 'Quality Assurance Fundamentals', code: 'QA101', description: 'Introduction to Quality Assurance principles and practices', level: 'L1' },
        { name: 'Advanced Testing Methodologies', code: 'QA201', description: 'In-depth testing strategies and automation', level: 'L2' },
        { name: 'Quality Management Systems', code: 'QA301', description: 'Enterprise-level quality management and compliance', level: 'L3' },
      ]);
      console.log('Seeded default courses');
    }

    // Seed default certificate template if not present
    const templateCount = await CertificateTemplate.count();
    if (templateCount === 0) {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const templatesDir = path.join(uploadsDir, 'certificate-templates');
      const thumbnailsDir = path.join(uploadsDir, 'certificate-thumbnails');

      // Ensure directories exist
      fs.mkdirSync(templatesDir, { recursive: true });
      fs.mkdirSync(thumbnailsDir, { recursive: true });

      // Create a simple default certificate template file (JSON metadata for now)
      const defaultTemplateData = {
        name: 'Default Certificate Template',
        description: 'Standard certificate template for course completion',
        fields: {
          recipientName: true,
          courseName: true,
          issueDate: true,
          certificateNumber: true
        },
        templateFile: 'certificate-templates/default-template.txt',
        thumbnail: 'certificate-thumbnails/default-thumb.png',
        isDefault: true,
        status: 'active'
      };

      const templatePath = path.join(templatesDir, 'default-template.txt');
      fs.writeFileSync(templatePath, `CERTIFICATE OF COMPLETION

This is to certify that

[RECIPIENT_NAME]

has successfully completed the course

[COURSE_NAME]

Certificate Number: [CERTIFICATE_NUMBER]
Issue Date: [ISSUE_DATE]

[ORGANIZATION_NAME]
Quality Assurance Department`);

      // Create thumbnail placeholder
      const thumbPath = path.join(thumbnailsDir, 'default-thumb.png');
      // Create a simple placeholder - in production you'd use a real image
      fs.writeFileSync(thumbPath, 'placeholder');

      await CertificateTemplate.create({
        name: 'Default Certificate Template',
        description: 'Standard certificate template for course completion',
        templateFile: 'certificate-templates/default-template.txt',
        thumbnail: 'certificate-thumbnails/default-thumb.png',
        isDefault: false,
        status: 'active',
        metadata: defaultTemplateData,
        fields: JSON.stringify(defaultTemplateData.fields)
      });
      console.log('Seeded default certificate template');

      const workingTemplatePath = path.join(templatesDir, 'working-template.txt');
      fs.writeFileSync(workingTemplatePath, `CERTIFICATE OF COMPLETION

This is to certify that

[RECIPIENT_NAME]

has successfully completed the course

[COURSE_NAME]

Certificate Number: [CERTIFICATE_NUMBER]
Issue Date: [ISSUE_DATE]

Automation Assessment System
Quality Assurance Department`);

      await CertificateTemplate.create({
        name: 'Working Certificate Template',
        description: 'Simple working certificate template that generates certificates automatically',
        templateFile: 'certificate-templates/working-template.txt',
        thumbnail: 'certificate-thumbnails/default-thumb.png',
        isDefault: true,
        status: 'active',
        metadata: {
          name: 'Working Certificate Template',
          description: 'Simple working certificate template that generates certificates automatically',
          fields: {
            recipientName: true,
            courseName: true,
            issueDate: true,
            certificateNumber: true,
            organizationName: true
          }
        },
        fields: JSON.stringify({
          recipientName: true,
          courseName: true,
          issueDate: true,
          certificateNumber: true,
          organizationName: true
        })
      });
      console.log('Seeded working certificate template');
    }
    app.listen(env.PORT, () => {
      console.log(`API running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
