'use strict';

/**
 * Adds two columns to the existing products table:
 *
 *  solar_component_type  — what kind of solar component this product is
 *                          NULL means it's a regular product, not a solar component
 *
 *  solar_specs           — structured JSON holding canonical specs for matching
 *
 *  Per component type, solar_specs shape is:
 *
 *    inverter:
 *      { kva: 5, voltage: 48 }
 *
 *    battery:
 *      { ah: 200, voltage: 48, kwh: 9.6, chemistry: "lithium" | "tubular" | "dry-cell" }
 *      Admin can enter either ah+voltage OR kwh — we store both.
 *
 *    solar-panel:
 *      { watts: 400, voc: 48.5 }
 *      voc is optional — watts is all the matcher needs.
 *
 *    charge-controller:
 *      { ampere: 60, voltage: 48, type: "mppt" | "pwm" }
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'solar_component_type', {
      type: Sequelize.ENUM(
        'inverter',
        'battery',
        'solar-panel',
        'charge-controller',
      ),
      allowNull:    true,
      defaultValue: null,
      after:        'listing_type',
      comment:      'NULL = regular product. Set this to make a product visible to the solar calculator.',
    });

    await queryInterface.addColumn('products', 'solar_specs', {
      type:         Sequelize.JSON,
      allowNull:    true,
      defaultValue: null,
      after:        'solar_component_type',
      comment:      'Canonical specs for solar matching. Shape varies by solar_component_type.',
    });

    await queryInterface.addIndex('products', ['solar_component_type'], {
      name: 'products_solar_component_type_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('products', 'products_solar_component_type_idx');
    await queryInterface.removeColumn('products', 'solar_specs');
    await queryInterface.removeColumn('products', 'solar_component_type');
  },
};
