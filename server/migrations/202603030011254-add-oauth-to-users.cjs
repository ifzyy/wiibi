/**
 * migrations/XXXXXX-create-oauth-accounts.js
 *
 * Creates the OAuthAccount table that links Users to third-party providers.
 *
 * One user can have multiple linked providers (google + apple, etc.).
 * The (provider, providerId) pair is the natural unique key.
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('oauth_accounts', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      user_id: {
        type:       Sequelize.UUID,   // match your Users.id type
        allowNull:  false,
        references: { model: 'Users', key: 'id' },
        onDelete:   'CASCADE',
        onUpdate:   'CASCADE',
      },
      provider: {
        // 'google' | 'apple' | 'facebook'
        type:      Sequelize.ENUM('google', 'apple', 'facebook'),
        allowNull: false,
      },
      provider_id: {
        type:      Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type:      Sequelize.STRING(255),
        allowNull: true,   // Apple sometimes withholds email
      },
      created_at: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type:      Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Enforce uniqueness — one account per provider per user
    await queryInterface.addIndex('oauth_accounts', ['provider', 'provider_id'], {
      unique: true,
      name:   'oauth_accounts_provider_provider_id_unique',
    });

    await queryInterface.addIndex('oauth_accounts', ['user_id'], {
      name: 'oauth_accounts_user_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('oauth_accounts');
  },
};