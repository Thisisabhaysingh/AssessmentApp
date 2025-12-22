import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(env.DB.NAME, env.DB.USER, env.DB.PASSWORD, {
  host: env.DB.HOST,
  port: env.DB.PORT,
  dialect: 'mysql',
  logging: env.DB.LOGGING ? console.log : false,
});

// Models loader to avoid circular imports
export const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
import UserModel from '../models/User.js';
import CourseModel from '../models/Course.js';
import AssessmentModel from '../models/Assessment.js';
import FeedbackModel from '../models/Feedback.js';
import TrainerCourseAssignmentModel from '../models/TrainerCourseAssignment.js';
import CertificateModel from '../models/Certificate.js';
import CertificateTemplateModel from '../models/CertificateTemplate.js';

const User = UserModel(sequelize);
const Course = CourseModel(sequelize);
const Assessment = AssessmentModel(sequelize);
const Feedback = FeedbackModel(sequelize);
const TrainerCourseAssignment = TrainerCourseAssignmentModel(sequelize);
const Certificate = CertificateModel(sequelize);
const CertificateTemplate = CertificateTemplateModel(sequelize);

// Simple SystemSettings object for now (no database persistence)
const SystemSettings = {
  findOne: async () => ({ passwordMinLength: 6, emailNotifications: true, autoCertificateGeneration: true }),
  create: async (data) => data,
  update: async (data) => data
};

// Associations
User.hasMany(Assessment, { foreignKey: 'trainer_id', as: 'trainerAssessments' });
Assessment.belongsTo(User, { foreignKey: 'trainer_id', as: 'trainer' });

// Manager assignment for assessments
User.hasMany(Assessment, { foreignKey: 'manager_id', as: 'managerAssessments' });
Assessment.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

Course.hasMany(Assessment, { foreignKey: 'course_id', as: 'assessments' });
Assessment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Assessment.hasMany(Feedback, { foreignKey: 'assessment_id', as: 'feedbacks' });
Feedback.belongsTo(Assessment, { foreignKey: 'assessment_id', as: 'assessment' });

User.hasMany(Feedback, { foreignKey: 'manager_id', as: 'managerFeedbacks' });
Feedback.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

User.belongsToMany(Course, { through: TrainerCourseAssignment, foreignKey: 'trainer_id', as: 'assignedCourses' });
Course.belongsToMany(User, { through: TrainerCourseAssignment, foreignKey: 'course_id', as: 'assignedTrainers' });

// Certificate associations
User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

CertificateTemplate.hasMany(Certificate, { foreignKey: 'templateId', as: 'certificates' });
Certificate.belongsTo(CertificateTemplate, { foreignKey: 'templateId', as: 'template' });

export { User, Course, Assessment, Feedback, TrainerCourseAssignment, Certificate, CertificateTemplate, SystemSettings };
