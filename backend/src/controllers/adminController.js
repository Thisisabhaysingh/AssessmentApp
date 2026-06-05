import bcrypt from 'bcryptjs';
import { User, Course, Activity, Assessment, TrainerCourseAssignment, SystemSettings, Certificate, CertificateTemplate, AssessmentManager } from '../config/db.js';
import { ok, created, bad } from '../utils/responseHelper.js';
import { generateCertificatePdf } from '../services/certificateService.js';
import { v4 as uuidv4 } from 'uuid';
import CertificateGenerationService from '../services/certificateGenerationService.js';

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

// Create new assessment with assigned managers and school ops managers
export const createAssessment = async (req, res) => {
  try {
    const { course_id, trainer_id, manager_ids, school_ops_manager_ids, scheduled_date } = req.body;
    
    // Validate required fields
    if (!course_id || !trainer_id || !scheduled_date) {
      return bad(res, 'Course, trainer, and scheduled date are required', 400);
    }
    
    const assessment = await Assessment.create({ 
      course_id, 
      trainer_id,
      scheduled_date,
      status: 'Scheduled'
    });
    
    // If managers are specified, create assignments
    if (manager_ids && Array.isArray(manager_ids) && manager_ids.length > 0) {
      const managerAssignments = manager_ids.map(manager_id => ({
        assessment_id: assessment.id,
        manager_id
      }));
      await AssessmentManager.bulkCreate(managerAssignments);
    }
    
    // If school ops managers are specified, create assignments
    if (school_ops_manager_ids && Array.isArray(school_ops_manager_ids) && school_ops_manager_ids.length > 0) {
      const schoolOpsAssignments = school_ops_manager_ids.map(school_ops_manager_id => ({
        assessment_id: assessment.id,
        manager_id: school_ops_manager_id
      }));
      await AssessmentManager.bulkCreate(schoolOpsAssignments);
    }
    
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
    const users = await User.count({ where: { status: 'active' } });
    const courses = await Course.count();
    const assessments = await Assessment.count();
    return ok(res, { users, courses, assessments });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.findAll({ 
      where: { deletedAt: null },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    // Format lastLogin and include trainer level data for display
    const formattedUsers = users.map(user => ({
      ...user.toJSON(),
      lastLogin: user.lastLogin 
        ? new Date(user.lastLogin).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short', 
            day: 'numeric'
          })
        : 'Never',
      trainerLevel: user.trainerLevel || 'L0',
      levelAchievedDate: user.levelAchievedDate,
      levelPerformanceData: user.levelPerformanceData || {}
    }));
    
    return ok(res, { users: formattedUsers });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

export const getAllCourses = async (_req, res) => {
  try {
    const courses = await Course.findAll({
      where: { deletedAt: null },
      attributes: ['id', 'name', 'description', 'level', 'createdAt', 'updatedAt'], // Only use existing fields
      include: [
        {
          model: Activity,
          as: 'activities',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Format the response with activity count
    const formattedCourses = courses.map(course => ({
      ...course.toJSON(),
      activityCount: course.activities ? course.activities.length : 0
    }));
    
    return ok(res, { courses: formattedCourses });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get all trainers for assessment assignment
export const getAllTrainers = async (_req, res) => {
  try {
    const trainers = await User.findAll({ 
      where: { role: 'trainer', status: 'active' },
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
      where: { role: 'manager', status: 'active' },
      attributes: ['id', 'name', 'email', 'department', 'designation']
    });
    return ok(res, { managers });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get all school ops managers for assessment assignment
export const getAllSchoolOpsManagers = async (_req, res) => {
  try {
    const schoolOpsManagers = await User.findAll({ 
      where: { role: 'school_ops_manager', status: 'active' },
      attributes: ['id', 'name', 'email', 'department', 'designation']
    });
    return ok(res, schoolOpsManagers, 'School Ops Managers retrieved successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get all assessments with related data including assigned managers
export const getAllAssessments = async (_req, res) => {
  try {
    const assessments = await Assessment.findAll({
      where: { deletedAt: null },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'name', 'level'] },
        { model: User, as: 'trainer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] }, // Legacy single manager
        { 
          model: User, 
          as: 'assignedManagers', 
          attributes: ['id', 'name', 'email', 'department', 'role'],
          required: false
        } // Multiple assigned managers (includes both managers and school ops managers)
      ],
      order: [['scheduled_date', 'DESC']]
    });

    // For each assessment, separate managers and school ops managers
    const assessmentsWithSeparatedRoles = assessments.map(assessment => {
      const assignedManagers = assessment.assignedManagers || [];
      const managers = assignedManagers.filter(user => user.role === 'manager');
      const schoolOpsManagers = assignedManagers.filter(user => user.role === 'school_ops_manager');
      
      return {
        ...assessment.toJSON(),
        assignedManagers: managers,
        assignedSchoolOpsManagers: schoolOpsManagers
      };
    });

    return ok(res, { assessments: assessmentsWithSeparatedRoles });
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Get system settings
export const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await SystemSettings.create({
        passingPercentage: 60,
        totalMarks: 60,
        schoolOpsManagerMarks: 25,
        managerMarks: 35,
        evaluationCriteria: {}
      });
    }
    
    return ok(res, settings, 'Settings retrieved successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update system settings
export const updateSettings = async (req, res) => {
  try {
    const {
      passingPercentage,
      totalMarks,
      schoolOpsManagerMarks,
      managerMarks,
      evaluationCriteria,
      // Keep existing settings
      twoFactorAuth,
      sessionTimeout,
      passwordMinLength,
      autoBackup,
      backupTime,
      dataRetention,
      performanceMonitoring,
      emailNotifications,
      assessmentReminders,
      performanceReports,
      reportFrequency
    } = req.body;
    
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create settings if they don't exist
      settings = await SystemSettings.create({
        passingPercentage: passingPercentage || 60,
        totalMarks: totalMarks || 60,
        schoolOpsManagerMarks: schoolOpsManagerMarks || 25,
        managerMarks: managerMarks || 35,
        evaluationCriteria: evaluationCriteria || {},
        twoFactorAuth: twoFactorAuth !== undefined ? twoFactorAuth : true,
        sessionTimeout: sessionTimeout || '8',
        passwordMinLength: passwordMinLength || '8',
        autoBackup: autoBackup !== undefined ? autoBackup : true,
        backupTime: backupTime || '2:00 AM',
        dataRetention: dataRetention || '2',
        performanceMonitoring: performanceMonitoring !== undefined ? performanceMonitoring : true,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        assessmentReminders: assessmentReminders !== undefined ? assessmentReminders : true,
        performanceReports: performanceReports !== undefined ? performanceReports : true,
        reportFrequency: reportFrequency || 'weekly'
      });
    } else {
      // Update existing settings
      await settings.update({
        passingPercentage: passingPercentage !== undefined ? passingPercentage : settings.passingPercentage,
        totalMarks: totalMarks !== undefined ? totalMarks : settings.totalMarks,
        schoolOpsManagerMarks: schoolOpsManagerMarks !== undefined ? schoolOpsManagerMarks : settings.schoolOpsManagerMarks,
        managerMarks: managerMarks !== undefined ? managerMarks : settings.managerMarks,
        evaluationCriteria: evaluationCriteria !== undefined ? evaluationCriteria : settings.evaluationCriteria,
        twoFactorAuth: twoFactorAuth !== undefined ? twoFactorAuth : settings.twoFactorAuth,
        sessionTimeout: sessionTimeout || settings.sessionTimeout,
        passwordMinLength: passwordMinLength || settings.passwordMinLength,
        autoBackup: autoBackup !== undefined ? autoBackup : settings.autoBackup,
        backupTime: backupTime || settings.backupTime,
        dataRetention: dataRetention || settings.dataRetention,
        performanceMonitoring: performanceMonitoring !== undefined ? performanceMonitoring : settings.performanceMonitoring,
        emailNotifications: emailNotifications !== undefined ? emailNotifications : settings.emailNotifications,
        assessmentReminders: assessmentReminders !== undefined ? assessmentReminders : settings.assessmentReminders,
        performanceReports: performanceReports !== undefined ? performanceReports : settings.performanceReports,
        reportFrequency: reportFrequency || settings.reportFrequency
      });
    }
    
    return ok(res, settings, 'Settings updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, designation, status } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) return bad(res, 'User not found', 404);
    
    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return bad(res, 'Email already exists', 400);
    }
    
    const updateData = { name, email, role, department, designation };
    
    // Add status if provided
    if (status !== undefined) {
      updateData.status = status;
    }
    
    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await user.update(updateData);
    return ok(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status } }, 'User updated successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Delete user (soft delete)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    
    if (!user) return bad(res, 'User not found', 404);
    
    // Soft delete by setting deletedAt timestamp
    await user.update({ deletedAt: new Date() });
    return ok(res, {}, 'User moved to trash successfully');
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

// Delete course (soft delete)
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) return bad(res, 'Course not found', 404);
    
    // Soft delete by setting deletedAt timestamp
    await course.update({ deletedAt: new Date() });
    return ok(res, {}, 'Course moved to trash successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};

// Update assessment
export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id, trainer_id, manager_ids, scheduled_date, status, clear_status, score } = req.body;

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
      scheduled_date,
      status,
      score,
      clear_status
    });

    // Update manager assignments if provided
    if (manager_ids && Array.isArray(manager_ids)) {
      // Clear existing assignments
      await AssessmentManager.destroy({
        where: { assessment_id: id }
      });
      
      // Create new assignments
      if (manager_ids.length > 0) {
        const assignments = manager_ids.map(manager_id => ({
          assessment_id: id,
          manager_id
        }));
        await AssessmentManager.bulkCreate(assignments);
      }
    }

    // If assessment status is changed to 'Completed', trigger certificate generation
    if (status === 'Completed' && assessment.status !== 'Completed') {
      try {
        console.log(`🎓 Assessment ${id} marked as completed, triggering certificate generation...`);
        
        // Generate certificates (both course and level if applicable)
        const certificateResults = await CertificateGenerationService.checkAndGenerateCertificates(parseInt(id));
        
        console.log(`📋 Certificate generation results:`, {
          courseCertificate: !!certificateResults.courseCertificate,
          levelCertificates: certificateResults.levelCertificates.length
        });
      } catch (certificateError) {
        console.error('Error generating certificates:', certificateError);
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

// Delete assessment (soft delete)
export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findByPk(id);
    
    if (!assessment) return bad(res, 'Assessment not found', 404);
    
    // Soft delete by setting deletedAt timestamp
    await assessment.update({ deletedAt: new Date() });
    return ok(res, {}, 'Assessment moved to trash successfully');
  } catch (error) {
    return bad(res, error.message, 500);
  }
};
