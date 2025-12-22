import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Course = sequelize.define('Course', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT },
    level: { type: DataTypes.ENUM('L1', 'L2', 'L3'), allowNull: false },
  }, { tableName: 'courses' });

  return Course;
};
