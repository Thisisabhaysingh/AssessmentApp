import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TrainerLevelQualifications = sequelize.define('TrainerLevelQualifications', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    trainerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the trainer (user)'
    },
    assessmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the assessment that qualified'
    },
    scorePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: 'The percentage score achieved in this assessment'
    },
    levelType: {
      type: DataTypes.ENUM('L1', 'L2', 'L3'),
      allowNull: false,
      comment: 'Which level this assessment qualifies for'
    },
    qualifiedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When this assessment qualified for the level'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this qualification is still active (for L3 recertification)'
    }
  }, {
    tableName: 'trainer_level_qualifications',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['trainerId', 'assessmentId', 'levelType']
      },
      {
        fields: ['trainerId', 'levelType']
      },
      {
        fields: ['levelType']
      }
    ]
  });

  return TrainerLevelQualifications;
};
