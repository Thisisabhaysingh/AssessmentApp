import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Assessment = sequelize.define('Assessment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    trainer_id: { type: DataTypes.INTEGER, allowNull: false },
    manager_id: { type: DataTypes.INTEGER, allowNull: true }, // Assigned manager for evaluation
    scheduled_date: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('Scheduled', 'Completed'), defaultValue: 'Scheduled' },
    score: { type: DataTypes.FLOAT, allowNull: true },
    clear_status: { type: DataTypes.ENUM('Pass', 'Fail'), allowNull: true }, // Pass/Fail status
    deletedAt: { 
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp - null if not deleted'
    }
  }, { tableName: 'assessments' });

  return Assessment;
};
