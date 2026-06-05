import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Security Settings
  twoFactorAuth: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  sessionTimeout: {
    type: DataTypes.STRING,
    defaultValue: '8',
    allowNull: false
  },
  passwordMinLength: {
    type: DataTypes.STRING,
    defaultValue: '8',
    allowNull: false
  },
  // Database Settings
  autoBackup: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  backupTime: {
    type: DataTypes.STRING,
    defaultValue: '2:00 AM',
    allowNull: false
  },
  dataRetention: {
    type: DataTypes.STRING,
    defaultValue: '2',
    allowNull: false
  },
  performanceMonitoring: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  // Notification Settings
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  assessmentReminders: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  performanceReports: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  reportFrequency: {
    type: DataTypes.STRING,
    defaultValue: 'weekly',
    allowNull: false
  },
  // Assessment Settings
  passingPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    allowNull: false,
    comment: 'Minimum percentage required to pass assessment'
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    allowNull: false,
    comment: 'Total marks for assessment (School Ops Manager: 25 + Manager: 35)'
  },
  schoolOpsManagerMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 25,
    allowNull: false,
    comment: 'Total marks for School Ops Manager evaluation'
  },
  managerMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 35,
    allowNull: false,
    comment: 'Total marks for Manager evaluation'
  },
  evaluationCriteria: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'JSON object containing evaluation criteria and parameters'
  },
  // Trainer Level Settings
  trainerLevelSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      L1: {
        totalAssessmentsRequired: 10,
        minScore: 70,
        qualifyingAssessmentsRequired: 10,
        enabled: true
      },
      L2: {
        totalAssessmentsRequired: 20,
        minScore: 85,
        qualifyingAssessmentsRequired: 10,
        enabled: true,
        requiresPreviousLevel: true
      },
      L3: {
        totalAssessmentsRequired: 25,
        minScore: 90,
        qualifyingAssessmentsRequired: 5,
        enabled: true,
        requiresPreviousLevel: true
      }
    },
    comment: 'JSON object containing trainer level progression criteria'
  }
}, {
  tableName: 'system_settings',
  timestamps: true
});

  return SystemSettings;
};
