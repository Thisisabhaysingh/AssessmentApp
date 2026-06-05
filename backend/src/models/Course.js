import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Course = sequelize.define('Course', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT },
    level: { type: DataTypes.ENUM('L1', 'L2', 'L3'), allowNull: false },
    // duration: { type: DataTypes.INTEGER, defaultValue: 0 }, // Temporarily removed - missing from DB
    // status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' }, // Temporarily removed - missing from DB
    deletedAt: { 
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp - null if not deleted'
    }
  }, { 
    tableName: 'courses',
    timestamps: true 
  });

  Course.associate = (models) => {
    Course.hasMany(models.Activity, { foreignKey: 'courseId', as: 'activities' });
  };

  return Course;
};
