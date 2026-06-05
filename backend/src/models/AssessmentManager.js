import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AssessmentManager = sequelize.define('AssessmentManager', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    assessment_id: { type: DataTypes.INTEGER, allowNull: false },
    manager_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { 
    tableName: 'assessment_managers',
    timestamps: false
  });

  return AssessmentManager;
};
