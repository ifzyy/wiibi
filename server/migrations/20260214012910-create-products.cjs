'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {

      // ── Identity ──────────────────────────────────────────────────────────
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      listing_type: {
        // "single"  → prose description + flat spec grid
        // "package" → component list + per-component spec tables + system_specification
        type: Sequelize.ENUM('single', 'package'),
        allowNull: false,
        defaultValue: 'single',
      },
      brand: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },

      // ── Pricing & stock ───────────────────────────────────────────────────
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      sale_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // ── Flags ─────────────────────────────────────────────────────────────
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      // ── Content ───────────────────────────────────────────────────────────
      short_description: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      description: {
        // Full HTML body. Rendered in the Description tab.
        type: Sequelize.TEXT,
        allowNull: true,
      },
      caption: {
        // Short marketing line shown beneath the product name on the detail page.
        // e.g. "Powers your home for 8hrs straight"
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      featured_image_url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // ── Taxonomy ─────────────────────────────────────────────────────────
      tags: {
        // ["solar", "backup", "lithium"]
        // Used for filtering, search boosting, and related product logic.
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },

      // ── Warranty ─────────────────────────────────────────────────────────
      warranty_duration: {
        // e.g. "1 year", "2 years", "18 months"
        // Shown in trust badges and the warranty section of the detail page.
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      warranty_details: {
        // Full warranty terms: what's covered, how to claim, exclusions.
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // ── JSON blobs ────────────────────────────────────────────────────────
      powered_devices: {
        // [{ label: "Tv", icon: "tv" }, ...]
        // Renders in the "To Power" widget. Primarily used for packages.
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      trust_badges: {
        // [{ icon: "🚚", label: "Free shipping" }, ...]
        // Overrides default trust badges on the detail page when present.
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      specifications: {
        // [{ label: "Output Power", value: "1000W" }, ...]
        // Flat spec grid. Used when listing_type = "single".
        // NULL for packages — their specs live on product_components.specs.
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      system_specification: {
        // Top-level system overview rendered for packages BEFORE the
        // per-component spec tables in the System Specification tab.
        // e.g. [{ label: "Total System Power", value: "5kWh" }, ...]
        // NULL for single products.
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },

      // ── Timestamps ────────────────────────────────────────────────────────
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // ── Indexes ───────────────────────────────────────────────────────────────
    await queryInterface.addIndex('products', ['category'],     { name: 'products_category_idx'     });
    await queryInterface.addIndex('products', ['listing_type'], { name: 'products_listing_type_idx' });
    await queryInterface.addIndex('products', ['is_featured'],  { name: 'products_is_featured_idx'  });
    await queryInterface.addIndex('products', ['is_visible'],   { name: 'products_is_visible_idx'   });
    await queryInterface.addIndex('products', ['stock'],        { name: 'products_stock_idx'        });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};