import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Evaluation = sequelize.define('Evaluation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    assessment_id: { type: DataTypes.INTEGER, allowNull: false },
    evaluator_role: { type: DataTypes.ENUM('school_ops_manager', 'manager'), allowNull: false },
    evaluator_id: { type: DataTypes.INTEGER, allowNull: false },
    
    // School Ops Manager parameters (25 marks total)
    timeBasedActivity: { type: DataTypes.INTEGER, defaultValue: 0 },
    studentEngagementIdeas: { type: DataTypes.INTEGER, defaultValue: 0 },
    poisedAndConfident: { type: DataTypes.INTEGER, defaultValue: 0 },
    wellModulatedVoice: { type: DataTypes.INTEGER, defaultValue: 0 },
    pleasingLook: { type: DataTypes.INTEGER, defaultValue: 0 },
    
    // Manager parameters (35 marks total)
    hasKnowledgeOfSTEM: { type: DataTypes.INTEGER, defaultValue: 0 },
    abilityToIntegrateSTEM: { type: DataTypes.INTEGER, defaultValue: 0 },
    discussesUpToDateInfo: { type: DataTypes.INTEGER, defaultValue: 0 },
    provideCourseOutline: { type: DataTypes.INTEGER, defaultValue: 0 },
    languageFluency: { type: DataTypes.INTEGER, defaultValue: 0 },
    preparationWithLessonPlan: { type: DataTypes.INTEGER, defaultValue: 0 },
    
    // Calculated fields
    totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    percentage: { type: DataTypes.FLOAT, defaultValue: 0 },
    
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { 
    tableName: 'evaluations', 
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });

  return Evaluation;
};
