import bcrypt from 'bcryptjs';
import { User, Course, Assessment, TrainerCourseAssignment, SystemSettings, Certificate, CertificateTemplate } from '../config/db.js';
import { ok, created, bad } from '../utils/responseHelper.js';
import { generateCertificatePdf } from '../services/certificateService.js';
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, designation } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return bad(res, 'Email already exists', 400);
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, department, designation });
    return created(res, { id: user.id, name: user.name, email: user.email, role: user.role }, 'User created');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const createCourse = async (req, res) => {
  try {
    const { name, description, level } = req.body;
    const course = await Course.create({ name, description, level });
    return created(res, { course }, 'Course created');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Create new assessment with assigned manager
export const createAssessment = async (req, res) => {
  try {
    const { course_id, trainer_id, manager_id, scheduled_date } = req.body;
    
    // Validate required fields
    if (!course_id || !trainer_id || !scheduled_date) {
      return bad(res, 'Course, trainer, and scheduled date are required', 400);
    }
    
    const assessment = await Assessment.create({ 
      course_id, 
      trainer_id,
      manager_id, // Assigned manager for evaluation
      scheduled_date,
      status: 'Scheduled'
    });
    return created(res, { assessment }, 'Assessment scheduled successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const assignCourse = async (req, res) => {
  try {
    const { trainer_id, course_id } = req.body;
    const row = await TrainerCourseAssignment.create({ trainer_id, course_id, assigned_by: req.user.id });
    return ok(res, { assignment: row }, 'Course assigned');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const overview = async (_req, res) => {
  try {
    const users = await User.count();
    const courses = await Course.count();
    const assessments = await Assessment.count();
    return ok(res, { users, courses, assessments });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    return ok(res, { users });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const getAllCourses = async (_req, res) => {
  try {
    const courses = await Course.findAll();
    return ok(res, { courses });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get all trainers for assessment assignment
export const getAllTrainers = async (_req, res) => {
  try {
    const trainers = await User.findAll({ 
      where: { role: 'trainer' },
      attributes: ['id', 'name', 'email', 'department', 'designation']
    });
    return ok(res, { trainers });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get all managers for assessment assignment
export const getAllManagers = async (_req, res) => {
  try {
    const managers = await User.findAll({ 
      where: { role: 'manager' },
      attributes: ['id', 'name', 'email', 'department', 'designation']
    });
    return ok(res, { managers });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get all assessments with related data including manager
export const getAllAssessments = async (_req, res) => {
  try {
    const assessments = await Assessment.findAll({
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'level'] },
        { model: User, as: 'trainer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] } // Include assigned manager
      ],
      order: [['scheduled_date', 'DESC']]
    });
    return ok(res, { assessments });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get system settings
export const getSettings = async (req, res) => {
  try {
    return ok(res, {
      passwordMinLength: 6,
      emailNotifications: true,
      autoCertificateGeneration: true
    });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update system settings
export const updateSettings = async (req, res) => {
  try {
    return ok(res, {
      passwordMinLength: req.body.passwordMinLength || 6,
      emailNotifications: req.body.emailNotifications || true,
      autoCertificateGeneration: req.body.autoCertificateGeneration || true
    }, 'Settings updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, designation } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) return bad(res, 'User not found', 404);
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return bad(res, 'Email already exists', 400);
    }
    
    const updateData = { name, email, role, department, designation };
    
    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await user.update(updateData);
    return ok(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 'User updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) return bad(res, 'User not found', 404);
    
    await user.destroy();
    return ok(res, {}, 'User deleted successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, level } = req.body;
    
    const course = await Course.findByPk(id);
    if (!course) return bad(res, 'Course not found', 404);
    
    await course.update({ name, description, level });
    return ok(res, { course }, 'Course updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) return bad(res, 'Course not found', 404);
    
    await course.destroy();
    return ok(res, {}, 'Course deleted successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update assessment
export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id, trainer_id, manager_id, scheduled_date, status, clear_status, score } = req.body;

    const assessment = await Assessment.findByPk(id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'trainer', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!assessment) return bad(res, 'Assessment not found', 404);

    // Update assessment
    await assessment.update({
      course_id,
      trainer_id,
      manager_id,
      scheduled_date,
      status,
      score,
      clear_status
    });

    // If assessment is marked as passed and doesn't already have a certificate, generate one
    if (clear_status === 'Pass' && assessment.status === 'Completed') {
      try {
        // Check if a certificate already exists for this assessment
        const existingCertificate = await Certificate.findOne({
          where: {
            userId: assessment.trainer_id,
            courseId: assessment.course_id
          }
        });

        if (!existingCertificate) {
          // Get default template or first available template
          const defaultTemplate = await CertificateTemplate.findOne({
            where: { status: 'active', isDefault: true }
          });

          let templateToUse = defaultTemplate;
          if (!templateToUse) {
            // If no default template, use the first active template
            templateToUse = await CertificateTemplate.findOne({
              where: { status: 'active' }
            });
          }

          if (templateToUse) {
            // Generate certificate
            const certificateNumber = `CERT-${uuidv4().slice(0, 8).toUpperCase()}`;
            const issueDate = new Date();

            const certificateData = {
              user: assessment.trainer,
              course: assessment.course,
              template: templateToUse,
              certificateNumber,
              issueDate,
              expiryDate: null // No expiry for now
            };

            // Generate the certificate file
            const filePath = await generateCertificatePdf(certificateData);

            // Create certificate record in database
            await Certificate.create({
              userId: assessment.trainer_id,
              courseId: assessment.course_id,
              templateId: templateToUse.id,
              certificateNumber,
              issueDate,
              status: 'active',
              filePath,
              isAutoGenerated: true,
              metadata: {
                assessmentId: assessment.id,
                generatedAt: new Date().toISOString(),
                reason: 'Assessment completion'
              }
            });

            console.log(`Certificate automatically generated for trainer ${assessment.trainer.name} after passing assessment for course ${assessment.course.name}`);
          }
        }
      } catch (certError) {
        console.error('Error generating certificate:', certError);
        // Don't fail the assessment update if certificate generation fails
      }
    }

    // Return updated assessment with related data
    const updatedAssessment = await Assessment.findByPk(id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'trainer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] }
      ]
    });

    return ok(res, { assessment: updatedAssessment }, 'Assessment updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Delete assessment
export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findByPk(id);
    
    if (!assessment) return bad(res, 'Assessment not found', 404);
    
    await assessment.destroy();
    return ok(res, {}, 'Assessment deleted successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};
