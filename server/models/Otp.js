'use strict';

export default (sequelize, DataTypes) => {
  const OtpSession = sequelize.define(
    'OtpSession',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: { model: 'users', key: 'id' },
      },
      otpHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'otp_hash',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_used',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
      },
    },
    {
      tableName: 'otp_sessions',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['expires_at'] },
      ],
    }
  );

  OtpSession.associate = (models) => {
    OtpSession.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return OtpSession;
};