'use strict';

import { time } from "node:console";

export default (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      // ── Identity ────────────────────────────────────────────────────────
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9-]+$/i,
          notEmpty: true,
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true },
      },
      listing_type: {
        // "single"  → prose description + flat spec grid
        // "package" → component list + per-component spec tables + system_specification
        type: DataTypes.ENUM('single', 'package'),
        allowNull: false,
        defaultValue: 'single',
        field: 'listing_type',
      },
      brand: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        field: 'sku',
      },

      // ── Pricing & stock ─────────────────────────────────────────────────
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      salePrice: {
        // Original / crossed-out price shown beside the main price.
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'sale_price',
        validate: { min: 0 },
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },

      // ── Flags ────────────────────────────────────────────────────────────
      is_featured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_featured',
      },
      is_visible: {
        // If false, hidden from all store listings but still accessible via direct link.
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_visible',
      },

      // ── Content ──────────────────────────────────────────────────────────
      shortDescription: {
        // Card sub-text (2-line clamp). Also shown in Description tab.
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'short_description',
      },
      description: {
        // Full HTML body rendered via dangerouslySetInnerHTML.
        type: DataTypes.TEXT,
        allowNull: true,
      },
      caption: {
        // Short marketing line shown beneath the product name on the detail page.
        // e.g. "Powers your home for 8hrs straight"
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      featured_image_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // ── Taxonomy ─────────────────────────────────────────────────────────
      tags: {
        // ["solar", "backup", "lithium"]
        // Used for filtering, search boosting, and related product logic.
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },

      // ── Warranty ─────────────────────────────────────────────────────────
      warrantyDuration: {
        // e.g. "1 year", "2 years", "18 months"
        // Shown in trust badges and the warranty section of the detail page.
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'warranty_duration',
      },
      warrantyDetails: {
        // Full warranty terms: what's covered, how to claim, exclusions.
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'warranty_details',
      },

      // ── JSON blobs ────────────────────────────────────────────────────────
      powered_devices: {
        // [{ label: "Tv", icon: "tv" }, ...]
        // Renders in the "To Power" widget. Primarily used for packages.
        type: DataTypes.JSON,
        allowNull: true,
        field: 'powered_devices',
        defaultValue: null,
      },
      trustBadges: {
        // [{ icon: "🚚", label: "Free shipping" }, ...]
        // Overrides the default trust badges on the detail page when present.
        type: DataTypes.JSON,
        allowNull: true,
        field: 'trust_badges',
        defaultValue: null,
      },
      specifications: {
        // [{ label: "Output Power", value: "1000W" }, ...]
        // Flat spec grid. Used when listing_type = "single".
        // NULL for packages — their specs live on product_components.specs.
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
      },
      systemSpecification: {
        // Top-level system overview rendered for packages BEFORE the
        // per-component spec tables in the System Specification tab.
        // e.g. [{ label: "Total System Power", value: "5kWh" }, ...]
        // NULL for single products.
        type: DataTypes.JSON,
        allowNull: true,
        field: 'system_specification',
        defaultValue: null,
      },
   // ── Timestamps ──────────────────────────────────────────────────────────
createdAt: {
  type: DataTypes.DATE,
  field: 'created_at',
},
updatedAt: {
  type: DataTypes.DATE,
  field: 'updated_at',
},
    },
    {
      tableName: 'products',
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { unique: true, fields: ['slug']         },
        { unique: true, fields: ['sku']          },
        { fields: ['category']                   },
        { fields: ['listing_type']               },
        { fields: ['is_featured']                },
        { fields: ['is_visible']                 },
        { fields: ['stock']                      },
      ],
    }
  );

  Product.associate = (models) => {
    // ── Media (via ProductMedia junction) ──────────────────────────────────
    // role = "main"      → hero/featured image shown as index 0 in gallery
    // role = "gallery"   → additional images ordered by display_order ASC
    // role = "thumbnail" → store card image if different from main
    Product.hasMany(models.ProductMedia, {
      foreignKey: 'product_id',
      as: 'mediaRelations',
      onDelete: 'CASCADE',
    });

    // ── Package components (listing_type = "package" only) ─────────────────
    // Always query with ORDER BY sort_order ASC.
    Product.hasMany(models.ProductComponent, {
      foreignKey: 'product_id',
      as: 'components',
      onDelete: 'CASCADE',
    });

    // ── Reviews ────────────────────────────────────────────────────────────
    // rating_summary (average, total, breakdown) is computed in the service
    // layer via SQL aggregation and attached to the response — not stored.
    Product.hasMany(models.ProductReview, {
      foreignKey: 'product_id',
      as: 'reviews',
      onDelete: 'CASCADE',
    });

    // ── Cart items ─────────────────────────────────────────────────────────
    Product.hasMany(models.CartItem, {
      foreignKey: 'product_id',
      as: 'cartItems',
    });
  };

  return Product;
};