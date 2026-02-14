'use strict';

export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true, // null for Google/social users
      },
      googleId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        field: 'google_id',
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'avatar_url',
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login',
      },
      // Simple address storage (expand to separate table later if needed)
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'shipping_address',
      },
      billingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'billing_address',
      },
      // For password reset flow
      passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'password_reset_token',
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'password_reset_expires',
      },
      // Optional: preferred contact for quotes/leads
      preferredContactMethod: {
        type: DataTypes.ENUM('email', 'phone', 'whatsapp'),
        allowNull: true,
        defaultValue: 'phone',
        field: 'preferred_contact_method',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        field: 'updated_at',
      },
    },
    {
      tableName: 'users',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['phone'], unique: true },
        { fields: ['google_id'], unique: true },
        { fields: ['role'] },
        { fields: ['password_reset_token'] },
      ],
    }
  );

  User.associate = (models) => {
    // Future relations – add as features are built
    // User.hasMany(models.Order, { foreignKey: 'userId' });
    // User.hasMany(models.Lead, { foreignKey: 'userId' });
    // User.hasMany(models.QuoteRequest, { foreignKey: 'userId' });
    // User.hasMany(models.CalculatorResult, { foreignKey: 'userId' });
    // User.hasMany(models.BlogComment, { foreignKey: 'userId' });
  };

  return User;
};