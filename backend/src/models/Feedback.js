import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Feedback = sequelize.define('Feedback', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    assessment_id: { type: DataTypes.INTEGER, allowNull: false },
    manager_id: { type: DataTypes.INTEGER, allowNull: false },
    feedback_text: { type: DataTypes.TEXT },
    score: { type: DataTypes.FLOAT },
    pass_fail: { type: DataTypes.ENUM('Pass', 'Fail'), allowNull: true }, // Changed from BOOLEAN to ENUM
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'feedbacks', timestamps: false });

  return Feedback;
};
