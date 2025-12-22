import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CertificateTemplate = sequelize.define('CertificateTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    templateFile: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    fields: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON configuration for certificate fields (name, date, etc.)'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    timestamps: true,
    tableName: 'CertificateTemplates',
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['isDefault']
      }
    ]
  });

  return CertificateTemplate;
};
