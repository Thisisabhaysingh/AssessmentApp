import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'manager', 'school_ops_manager', 'trainer'), allowNull: false },
    department: { type: DataTypes.STRING },
    designation: { type: DataTypes.STRING },
    status: { 
      type: DataTypes.ENUM('active', 'inactive'), 
      defaultValue: 'active',
      allowNull: false 
    },
    lastLogin: { 
      type: DataTypes.DATE,
      allowNull: true 
    },
    // Trainer level fields
    trainerLevel: { 
      type: DataTypes.ENUM('L0', 'L1', 'L2', 'L3'), 
      defaultValue: 'L0',
      allowNull: false,
      comment: 'Trainer certification level'
    },
    levelAchievedDate: { 
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when current level was achieved'
    },
    levelPerformanceData: { 
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Store assessment counts and qualifying assessments for each level'
    },
    deletedAt: { 
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp - null if not deleted'
    }
  }, { 
    tableName: 'users',
    timestamps: true // This will add createdAt and updatedAt
  });

  return User;
};
