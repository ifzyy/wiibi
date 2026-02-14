"use strict";

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin123Secure!", salt); // Change this password immediately after first login

    await queryInterface.bulkInsert("users", [
      {
        id: "admin-0001-uuid", // Use a fixed short ID for seed (or let UUIDV4 generate)
        first_name: "Admin",
        last_name: "Wiibi",
        email: "admin@wiibienergy.com",
        phone: "09162102080",
        password: hashedPassword,
        google_id: null,
        avatar_url: null,
        role: "admin",
        is_active: true,
        last_login: null,
        shipping_address:
          "1, Olaoluwa Street, Off Adebowale Road, Ojodu, Lagos",
        billing_address: "1, Olaoluwa Street, Off Adebowale Road, Ojodu, Lagos",
        preferred_contact_method: "phone",
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      "users",
      { email: "admin@wiibienergy.com" },
      {},
    );
  },
};
