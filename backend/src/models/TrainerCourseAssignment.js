import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TrainerCourseAssignment = sequelize.define('TrainerCourseAssignment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    trainer_id: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_by: { type: DataTypes.INTEGER },
  }, { tableName: 'trainer_course_assignments' });

  return TrainerCourseAssignment;
};
