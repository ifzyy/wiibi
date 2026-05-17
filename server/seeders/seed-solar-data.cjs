'use strict';

const now = new Date();

// ── Full PRD appliance list ───────────────────────────────────────────────────
const APPLIANCES = [
  // Lighting
  { category: 'Lighting',               icon: '💡', name: 'LED Bulb',                       watts_min: 5,    watts_max: 20,   default_hours: 8,   surge_multiplier: 1.0, is_critical: true,  sort_order: 1  },
  { category: 'Lighting',               icon: '💡', name: 'Energy Bulb (CFL)',               watts_min: 11,   watts_max: 25,   default_hours: 8,   surge_multiplier: 1.0, is_critical: true,  sort_order: 2  },
  { category: 'Lighting',               icon: '✨', name: 'Chandelier (small/medium)',        watts_min: 30,   watts_max: 60,   default_hours: 6,   surge_multiplier: 1.0, is_critical: false, sort_order: 3  },
  { category: 'Lighting',               icon: '🔦', name: 'Outdoor / Security Floodlight',   watts_min: 30,   watts_max: 100,  default_hours: 8,   surge_multiplier: 1.0, is_critical: false, sort_order: 4  },
  { category: 'Lighting',               icon: '🌟', name: 'Wall Lights',                     watts_min: 10,   watts_max: 20,   default_hours: 6,   surge_multiplier: 1.0, is_critical: false, sort_order: 5  },
  // Fans & Cooling
  { category: 'Fans & Cooling',         icon: '🌀', name: 'Ceiling Fan',                     watts_min: 50,   watts_max: 75,   default_hours: 8,   surge_multiplier: 1.5, is_critical: true,  sort_order: 10 },
  { category: 'Fans & Cooling',         icon: '🌀', name: 'Standing Fan',                    watts_min: 40,   watts_max: 60,   default_hours: 6,   surge_multiplier: 1.5, is_critical: false, sort_order: 11 },
  { category: 'Fans & Cooling',         icon: '🌀', name: 'Table Fan',                       watts_min: 25,   watts_max: 50,   default_hours: 6,   surge_multiplier: 1.5, is_critical: false, sort_order: 12 },
  { category: 'Fans & Cooling',         icon: '💨', name: 'Exhaust Fan',                     watts_min: 30,   watts_max: 50,   default_hours: 4,   surge_multiplier: 1.5, is_critical: false, sort_order: 13 },
  { category: 'Fans & Cooling',         icon: '❄️', name: 'Air Conditioner (1HP)',           watts_min: 746,  watts_max: 900,  default_hours: 8,   surge_multiplier: 3.0, is_critical: false, sort_order: 14 },
  { category: 'Fans & Cooling',         icon: '❄️', name: 'Air Conditioner (1.5HP)',         watts_min: 1119, watts_max: 1300, default_hours: 8,   surge_multiplier: 3.0, is_critical: false, sort_order: 15 },
  { category: 'Fans & Cooling',         icon: '❄️', name: 'Air Conditioner (2HP)',           watts_min: 1492, watts_max: 1800, default_hours: 8,   surge_multiplier: 3.0, is_critical: false, sort_order: 16 },
  { category: 'Fans & Cooling',         icon: '🌬️', name: 'Air Cooler (small)',              watts_min: 60,   watts_max: 150,  default_hours: 6,   surge_multiplier: 1.5, is_critical: false, sort_order: 17 },
  // Entertainment
  { category: 'Entertainment',          icon: '📺', name: 'TV (32"–55")',                    watts_min: 40,   watts_max: 90,   default_hours: 6,   surge_multiplier: 1.0, is_critical: false, sort_order: 20 },
  { category: 'Entertainment',          icon: '📺', name: 'TV (55"–65")',                    watts_min: 80,   watts_max: 150,  default_hours: 6,   surge_multiplier: 1.0, is_critical: false, sort_order: 21 },
  { category: 'Entertainment',          icon: '📡', name: 'Decoder (DSTV/GOTV)',             watts_min: 20,   watts_max: 30,   default_hours: 6,   surge_multiplier: 1.0, is_critical: false, sort_order: 22 },
  { category: 'Entertainment',          icon: '🔊', name: 'Soundbar',                        watts_min: 30,   watts_max: 80,   default_hours: 4,   surge_multiplier: 1.0, is_critical: false, sort_order: 23 },
  { category: 'Entertainment',          icon: '🎵', name: 'Home Theatre System',             watts_min: 100,  watts_max: 300,  default_hours: 4,   surge_multiplier: 1.0, is_critical: false, sort_order: 24 },
  { category: 'Entertainment',          icon: '🎮', name: 'Gaming Console (PS/Xbox)',        watts_min: 100,  watts_max: 200,  default_hours: 4,   surge_multiplier: 1.0, is_critical: false, sort_order: 25 },
  { category: 'Entertainment',          icon: '📽️', name: 'Projector',                       watts_min: 150,  watts_max: 350,  default_hours: 3,   surge_multiplier: 1.0, is_critical: false, sort_order: 26 },
  // Kitchen
  { category: 'Kitchen',                icon: '🧊', name: 'Refrigerator (small)',            watts_min: 80,   watts_max: 120,  default_hours: 24,  surge_multiplier: 2.0, is_critical: true,  sort_order: 30 },
  { category: 'Kitchen',                icon: '🧊', name: 'Refrigerator (medium)',           watts_min: 120,  watts_max: 180,  default_hours: 24,  surge_multiplier: 2.0, is_critical: true,  sort_order: 31 },
  { category: 'Kitchen',                icon: '🧊', name: 'Refrigerator (double door)',      watts_min: 180,  watts_max: 250,  default_hours: 24,  surge_multiplier: 2.0, is_critical: false, sort_order: 32 },
  { category: 'Kitchen',                icon: '🧊', name: 'Freezer (small)',                 watts_min: 100,  watts_max: 150,  default_hours: 24,  surge_multiplier: 2.0, is_critical: false, sort_order: 33 },
  { category: 'Kitchen',                icon: '🧊', name: 'Freezer (big)',                   watts_min: 150,  watts_max: 250,  default_hours: 24,  surge_multiplier: 2.0, is_critical: false, sort_order: 34 },
  { category: 'Kitchen',                icon: '📦', name: 'Microwave',                       watts_min: 700,  watts_max: 1200, default_hours: 1,   surge_multiplier: 1.5, is_critical: false, sort_order: 35 },
  { category: 'Kitchen',                icon: '🥤', name: 'Blender',                         watts_min: 300,  watts_max: 600,  default_hours: 0.5, surge_multiplier: 2.0, is_critical: false, sort_order: 36 },
  { category: 'Kitchen',                icon: '☕', name: 'Electric Kettle',                 watts_min: 1000, watts_max: 1500, default_hours: 0.5, surge_multiplier: 1.0, is_critical: false, sort_order: 37 },
  { category: 'Kitchen',                icon: '🍞', name: 'Toaster',                         watts_min: 600,  watts_max: 900,  default_hours: 0.5, surge_multiplier: 1.0, is_critical: false, sort_order: 38 },
  { category: 'Kitchen',                icon: '🍳', name: 'Electric Cooker / Hot Plate',     watts_min: 1000, watts_max: 2000, default_hours: 1,   surge_multiplier: 1.0, is_critical: false, sort_order: 39 },
  { category: 'Kitchen',                icon: '🔥', name: 'Gas Cooker Ignition',             watts_min: 5,    watts_max: 10,   default_hours: 1,   surge_multiplier: 1.0, is_critical: false, sort_order: 40 },
  // Water & Home Utility
  { category: 'Water & Home Utility',   icon: '💧', name: 'Water Pump (0.5HP)',              watts_min: 373,  watts_max: 450,  default_hours: 2,   surge_multiplier: 3.0, is_critical: true,  sort_order: 50 },
  { category: 'Water & Home Utility',   icon: '💧', name: 'Water Pump (1HP)',                watts_min: 746,  watts_max: 900,  default_hours: 2,   surge_multiplier: 3.0, is_critical: true,  sort_order: 51 },
  { category: 'Water & Home Utility',   icon: '💧', name: 'Water Pump (1.5HP)',              watts_min: 1119, watts_max: 1300, default_hours: 2,   surge_multiplier: 3.0, is_critical: false, sort_order: 52 },
  { category: 'Water & Home Utility',   icon: '🕳️', name: 'Borehole Pump (2HP)',            watts_min: 1492, watts_max: 1800, default_hours: 2,   surge_multiplier: 3.0, is_critical: false, sort_order: 53 },
  { category: 'Water & Home Utility',   icon: '👕', name: 'Washing Machine',                 watts_min: 400,  watts_max: 600,  default_hours: 1,   surge_multiplier: 2.0, is_critical: false, sort_order: 54 },
  { category: 'Water & Home Utility',   icon: '👔', name: 'Iron',                            watts_min: 800,  watts_max: 1200, default_hours: 1,   surge_multiplier: 1.0, is_critical: false, sort_order: 55 },
  { category: 'Water & Home Utility',   icon: '🌀', name: 'Vacuum Cleaner',                  watts_min: 600,  watts_max: 1200, default_hours: 0.5, surge_multiplier: 2.0, is_critical: false, sort_order: 56 },
  // Office / Work
  { category: 'Office / Work',          icon: '📡', name: 'Wi-Fi Router',                    watts_min: 8,    watts_max: 15,   default_hours: 24,  surge_multiplier: 1.0, is_critical: true,  sort_order: 60 },
  { category: 'Office / Work',          icon: '💻', name: 'Laptop Charger',                  watts_min: 45,   watts_max: 90,   default_hours: 8,   surge_multiplier: 1.0, is_critical: true,  sort_order: 61 },
  { category: 'Office / Work',          icon: '🖥️', name: 'Desktop Computer',                watts_min: 150,  watts_max: 300,  default_hours: 8,   surge_multiplier: 1.0, is_critical: false, sort_order: 62 },
  { category: 'Office / Work',          icon: '🖨️', name: 'Printer',                         watts_min: 200,  watts_max: 500,  default_hours: 1,   surge_multiplier: 1.5, is_critical: false, sort_order: 63 },
  { category: 'Office / Work',          icon: '📹', name: 'CCTV Monitor',                    watts_min: 20,   watts_max: 40,   default_hours: 24,  surge_multiplier: 1.0, is_critical: false, sort_order: 64 },
  { category: 'Office / Work',          icon: '🏧', name: 'POS Machine',                     watts_min: 30,   watts_max: 50,   default_hours: 10,  surge_multiplier: 1.0, is_critical: true,  sort_order: 65 },
  // Charging & Small Loads
  { category: 'Charging & Small Loads', icon: '📱', name: 'Mobile Phone Charger',            watts_min: 5,    watts_max: 20,   default_hours: 4,   surge_multiplier: 1.0, is_critical: true,  sort_order: 70 },
  { category: 'Charging & Small Loads', icon: '📱', name: 'Tablet Charger',                  watts_min: 10,   watts_max: 25,   default_hours: 3,   surge_multiplier: 1.0, is_critical: false, sort_order: 71 },
  { category: 'Charging & Small Loads', icon: '🔋', name: 'Power Bank Charging',             watts_min: 10,   watts_max: 20,   default_hours: 2,   surge_multiplier: 1.0, is_critical: false, sort_order: 72 },
  { category: 'Charging & Small Loads', icon: '📷', name: 'Camera Charger',                  watts_min: 10,   watts_max: 20,   default_hours: 2,   surge_multiplier: 1.0, is_critical: false, sort_order: 73 },
  // Security & Automation
  { category: 'Security & Automation',  icon: '📹', name: 'CCTV Camera (per camera)',        watts_min: 5,    watts_max: 15,   default_hours: 24,  surge_multiplier: 1.0, is_critical: true,  sort_order: 80 },
  { category: 'Security & Automation',  icon: '🗄️', name: 'NVR / DVR System',               watts_min: 10,   watts_max: 30,   default_hours: 24,  surge_multiplier: 1.0, is_critical: true,  sort_order: 81 },
  { category: 'Security & Automation',  icon: '⚡', name: 'Electric Fence (small)',          watts_min: 20,   watts_max: 50,   default_hours: 24,  surge_multiplier: 1.0, is_critical: false, sort_order: 82 },
  { category: 'Security & Automation',  icon: '💡', name: 'Motion Sensor Lights',            watts_min: 10,   watts_max: 30,   default_hours: 4,   surge_multiplier: 1.0, is_critical: false, sort_order: 83 },
  { category: 'Security & Automation',  icon: '🔒', name: 'Smart Lock',                      watts_min: 3,    watts_max: 10,   default_hours: 24,  surge_multiplier: 1.0, is_critical: false, sort_order: 84 },
  { category: 'Security & Automation',  icon: '🔔', name: 'Smart Doorbell',                  watts_min: 2,    watts_max: 8,    default_hours: 24,  surge_multiplier: 1.0, is_critical: false, sort_order: 85 },
  { category: 'Security & Automation',  icon: '🚪', name: 'Electric Gate / Auto Doors',      watts_min: 100,  watts_max: 250,  default_hours: 1,   surge_multiplier: 2.0, is_critical: false, sort_order: 86 },
  // Other
  { category: 'Other',                  icon: '💇', name: 'Hair Dryer',                      watts_min: 1000, watts_max: 1800, default_hours: 0.5, surge_multiplier: 1.0, is_critical: false, sort_order: 90 },
  { category: 'Other',                  icon: '✂️', name: 'Clipper / Barber Kit',            watts_min: 10,   watts_max: 25,   default_hours: 2,   surge_multiplier: 1.0, is_critical: false, sort_order: 91 },
  { category: 'Other',                  icon: '🪡', name: 'Sewing Machine',                  watts_min: 60,   watts_max: 100,  default_hours: 4,   surge_multiplier: 1.5, is_critical: false, sort_order: 92 },
];

// ── Admin-configurable cost rates ─────────────────────────────────────────────
const SETTINGS = [
  { key: 'monthly_grid_cost',   label: 'Avg monthly grid / fuel cost (₦)',     value: 45000,  unit: '₦/month', description: 'Used to calculate annual savings and ROI estimates shown to customers' },
  { key: 'vat_rate',            label: 'VAT rate (%)',                          value: 7.5,    unit: '%',       description: 'Applied to all system cost estimates' },
  // Inverter cost rates
  { key: 'inverter_cost_min',   label: 'Inverter cost per kVA — minimum (₦)', value: 320000, unit: '₦/kVA',  description: 'Lower bound for inverter cost estimate' },
  { key: 'inverter_cost_max',   label: 'Inverter cost per kVA — maximum (₦)', value: 450000, unit: '₦/kVA',  description: 'Upper bound for inverter cost estimate' },
  // Battery cost rates
  { key: 'battery_cost_min',    label: 'Battery cost per kWh — minimum (₦)',  value: 100000, unit: '₦/kWh',  description: 'Lower bound for battery bank cost' },
  { key: 'battery_cost_max',    label: 'Battery cost per kWh — maximum (₦)',  value: 150000, unit: '₦/kWh',  description: 'Upper bound for battery bank cost' },
  // Panel cost rates
  { key: 'panel_cost_min',      label: 'Panel cost per kWp — minimum (₦)',    value: 80000,  unit: '₦/kWp',  description: 'Lower bound for solar panel cost' },
  { key: 'panel_cost_max',      label: 'Panel cost per kWp — maximum (₦)',    value: 120000, unit: '₦/kWp',  description: 'Upper bound for solar panel cost' },
  // Installation
  { key: 'install_cost_min',    label: 'Installation flat fee — minimum (₦)', value: 50000,  unit: '₦',      description: 'Base installation lower bound' },
  { key: 'install_cost_max',    label: 'Installation flat fee — maximum (₦)', value: 120000, unit: '₦',      description: 'Base installation upper bound' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'solar_appliances',
      APPLIANCES.map(a => ({ ...a, is_active: true, created_at: now, updated_at: now })),
    );
    await queryInterface.bulkInsert(
      'solar_settings',
      SETTINGS.map(s => ({ ...s, created_at: now, updated_at: now })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('solar_appliances', null, {});
    await queryInterface.bulkDelete('solar_settings',   null, {});
  },
};
