'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class OAuthAccount extends Model {
    static associate(models) {
      OAuthAccount.belongsTo(models.User, {
        foreignKey: 'userId',
        as:         'user',
      });
    }
  }

  OAuthAccount.init(
    {
      userId: {
        type:      DataTypes.UUID,   // matches User.id
        allowNull: false,
      },
      provider: {
        type:      DataTypes.ENUM('google', 'apple', 'facebook'),
        allowNull: false,
      },
      providerId: {
        type:      DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type:      DataTypes.STRING(255),
        allowNull: true,   // Apple sometimes withholds email
      },
    },
    {
      sequelize,
      paranoid:     false,              // adds deletedAt timestamp for soft deletes
      modelName:   'OAuthAccount',
      tableName:   'oauth_accounts',   // snake_case matches underscored: true convention
      underscored: true,
      indexes: [
        { unique: true, fields: ['provider', 'provider_id'] },
        { fields: ['user_id'] },
      ],
    }
  );

  return OAuthAccount;
};