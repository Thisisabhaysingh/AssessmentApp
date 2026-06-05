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
import ActivityModel from '../models/Activity.js';
import AssessmentModel from '../models/Assessment.js';
import FeedbackModel from '../models/Feedback.js';
import TrainerCourseAssignmentModel from '../models/TrainerCourseAssignment.js';
import CertificateModel from '../models/Certificate.js';
import CertificateTemplateModel from '../models/CertificateTemplate.js';
import AssessmentManagerModel from '../models/AssessmentManager.js';
import EvaluationModel from '../models/Evaluation.js';
import SystemSettingsModel from '../models/SystemSettings.js';
import TrainerLevelQualificationsModel from '../models/TrainerLevelQualifications.js';

const User = UserModel(sequelize);
const Course = CourseModel(sequelize);
const Activity = ActivityModel(sequelize);
const Assessment = AssessmentModel(sequelize);
const Feedback = FeedbackModel(sequelize);
const TrainerCourseAssignment = TrainerCourseAssignmentModel(sequelize);
const Certificate = CertificateModel(sequelize);
const CertificateTemplate = CertificateTemplateModel(sequelize);
const AssessmentManager = AssessmentManagerModel(sequelize);
const Evaluation = EvaluationModel(sequelize);
const SystemSettings = SystemSettingsModel(sequelize);
const TrainerLevelQualifications = TrainerLevelQualificationsModel(sequelize);

// Associations
User.hasMany(Assessment, { foreignKey: 'trainer_id', as: 'trainerAssessments' });
Assessment.belongsTo(User, { foreignKey: 'trainer_id', as: 'trainer' });

// Manager assignment for assessments (legacy - keep for backward compatibility)
User.hasMany(Assessment, { foreignKey: 'manager_id', as: 'managerAssessments' });
Assessment.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// Many-to-many relationship between assessments and managers
Assessment.belongsToMany(User, { 
  through: AssessmentManager, 
  foreignKey: 'assessment_id', 
  otherKey: 'manager_id', 
  as: 'assignedManagers' 
});
User.belongsToMany(Assessment, { 
  through: AssessmentManager, 
  foreignKey: 'manager_id', 
  otherKey: 'assessment_id', 
  as: 'assignedAssessments' 
});

Course.hasMany(Assessment, { foreignKey: 'course_id', as: 'assessments' });
Assessment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course-Activity associations
Course.hasMany(Activity, { foreignKey: 'courseId', as: 'activities' });
Activity.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

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

// Evaluation associations
Assessment.hasMany(Evaluation, { foreignKey: 'assessment_id', as: 'evaluations' });
Evaluation.belongsTo(Assessment, { foreignKey: 'assessment_id', as: 'assessment' });

User.hasMany(Evaluation, { foreignKey: 'evaluator_id', as: 'evaluations' });
Evaluation.belongsTo(User, { foreignKey: 'evaluator_id', as: 'evaluator' });

// Trainer Level Qualifications associations
User.hasMany(TrainerLevelQualifications, { foreignKey: 'trainerId', as: 'levelQualifications' });
TrainerLevelQualifications.belongsTo(User, { foreignKey: 'trainerId', as: 'trainer' });

Assessment.hasMany(TrainerLevelQualifications, { foreignKey: 'assessmentId', as: 'levelQualifications' });
TrainerLevelQualifications.belongsTo(Assessment, { foreignKey: 'assessmentId', as: 'assessment' });

export { User, Course, Activity, Assessment, Feedback, TrainerCourseAssignment, Certificate, CertificateTemplate, AssessmentManager, Evaluation, SystemSettings, TrainerLevelQualifications };
