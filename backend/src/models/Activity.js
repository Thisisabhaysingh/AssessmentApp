import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Activity = sequelize.define('Activity', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    type: { 
      type: DataTypes.ENUM('reading', 'video', 'quiz', 'assignment', 'practical', 'project'), 
      allowNull: false 
    },
    duration: { type: DataTypes.INTEGER, allowNull: false }, // in minutes
    order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    isRequired: { type: DataTypes.BOOLEAN, defaultValue: true },
    courseId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    content: { type: DataTypes.TEXT }, // JSON content for different activity types
    resources: { type: DataTypes.TEXT }, // JSON array of resources
    passingScore: { type: DataTypes.INTEGER, defaultValue: 70 }, // For quiz activities
    maxAttempts: { type: DataTypes.INTEGER, defaultValue: 3 }, // For quiz activities
  }, { 
    tableName: 'activities',
    timestamps: true
  });

  Activity.associate = (models) => {
    Activity.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
  };

  return Activity;
};
