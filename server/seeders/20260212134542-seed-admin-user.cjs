'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hashedPassword = await bcrypt.hash('Admin123Secure!', 12);

    await queryInterface.bulkInsert('users', [
      {
        id:                     '00000000-0000-0000-0000-000000000001',
        phone_number:           '+2347074375422',
        is_verified:            true,
        password:               hashedPassword,
        password_set_at:        new Date(),
        password_reset_token:   null,
        password_reset_expires: null,
        first_name:             'Admin',
        last_name:              'Wiibi',
        avatar_url:             null,
        role:                   'admin',
        is_active:              true,
        last_login_at:          null,
        shipping_address:       JSON.stringify({
          fullName:     'Admin Wiibi',
          addressLine1: '1, Olaoluwa Street, Off Adebowale Road',
          city:         'Lagos',
          state:        'Lagos',
          postalCode:   '100001',
          country:      'NG',
          phone:        '+23474375422',
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'users',
      { phone_number: '+23474375422' },
      {}
    );
  },
};
