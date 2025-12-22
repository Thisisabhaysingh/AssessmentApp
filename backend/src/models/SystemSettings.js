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
  }
}, {
  tableName: 'system_settings',
  timestamps: true
});

  return SystemSettings;
};
