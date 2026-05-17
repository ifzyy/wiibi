'use strict';

export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type:         DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey:   true,
      },
      email: {
        type:      DataTypes.STRING(255),
        allowNull: true,
        unique:    true,
      },
      phoneNumber: {
        type:      DataTypes.STRING(20),
        allowNull: true,
        unique:    true,
        field:     'phone_number',
      },
      isVerified: {
        type:         DataTypes.BOOLEAN,
        defaultValue: false,
        field:        'is_verified',
      },
      // ── Password auth (optional — set after OTP verification) ──────────────
      password: {
        type:      DataTypes.STRING(255),
        allowNull: true,   // null until user explicitly sets a password
      },
      passwordSetAt: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'password_set_at',
      },
      // ── Password reset flow ────────────────────────────────────────────────
      passwordResetToken: {
        type:      DataTypes.STRING(255),
        allowNull: true,
        field:     'password_reset_token',
      },
      passwordResetExpires: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'password_reset_expires',
      },
      // ── Profile ───────────────────────────────────────────────────────────
      firstName: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'first_name',
      },
      lastName: {
        type:      DataTypes.STRING(100),
        allowNull: true,
        field:     'last_name',
      },
      avatarUrl: {
        type:      DataTypes.STRING(500),
        allowNull: true,
        field:     'avatar_url',
      },
      // ── Role & status ─────────────────────────────────────────────────────
      role: {
        type:         DataTypes.ENUM('user', 'admin'),
        allowNull:    false,
        defaultValue: 'user',
      },
      isActive: {
        type:         DataTypes.BOOLEAN,
        defaultValue: true,
        field:        'is_active',
      },
      lastLoginAt: {
        type:      DataTypes.DATE,
        allowNull: true,
        field:     'last_login_at',
      },
      // ── Addresses (simple JSON — move to own table when needed) ───────────
      shippingAddress: {
        type:      DataTypes.JSON,
        allowNull: true,
        field:     'shipping_address',
      },
    },
    {
      tableName:   'users',
      underscored: true,
      paranoid:    false,
      indexes: [
        { fields: ['phone_number'],        unique: true },
        { fields: ['role'] },
        { fields: ['is_active'] },
        { fields: ['password_reset_token'] },
      ],
    }
  );

  // ── Associations ────────────────────────────────────────────────────────────
  User.associate = (models) => {
    User.hasMany(models.OtpSession,    { foreignKey: 'userId', as: 'otpSessions',    onDelete: 'CASCADE' });
    User.hasMany(models.RefreshToken,  { foreignKey: 'userId', as: 'refreshTokens',  onDelete: 'CASCADE' });
    User.hasOne (models.Cart,          { foreignKey: 'userId', as: 'cart' });
    User.hasMany(models.Order,         { foreignKey: 'userId', as: 'orders' });
    User.hasMany(models.OAuthAccount,  { foreignKey: 'userId', as: 'oauthAccounts',  onDelete: 'CASCADE' });
  };

  // ── Safe public representation ──────────────────────────────────────────────
  // Never exposes password hash, reset tokens, or raw OAuth data.
  User.prototype.toSafeJSON = function () {
    return {
      id:              this.id,
      email:           this.email,
      phoneNumber:     this.phoneNumber,
      firstName:       this.firstName,
      lastName:        this.lastName,
      avatarUrl:       this.avatarUrl,
      isVerified:      this.isVerified,
      hasPassword:     !!this.password,   // boolean only — never the hash
      role:            this.role,
      isActive:        this.isActive,
      lastLoginAt:     this.lastLoginAt,
      passwordSetAt:   this.passwordSetAt,
      shippingAddress: this.shippingAddress,
      createdAt:       this.createdAt,
      updatedAt:       this.updatedAt,
    };
  };

  return User;
};