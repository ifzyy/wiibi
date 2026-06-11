/**
 * services/SolarCalculatorService.js
 *
 * Pure engineering math — no DB, no Express.
 * Every function is exported for unit testing.
 *
 * Receives settings as a Map (loaded by controller) so admin can
 * update cost rates live without a redeploy.
 *
 * Three tiers:
 *   sufficient  — exactly what the load needs, zero buffer
 *   recommended — 30% more panels, 50% more battery (the sweet spot)
 *   overkill    — 60% more panels, 2× battery, next inverter step up
 */

// ── Location → peak sun hours (h/day) ────────────────────────────────────────
export const PEAK_SUN_HOURS = {
  'Lagos':         4.5,
  'Abuja':         5.5,
  'Kano':          6.5,
  'Port Harcourt': 4.0,
  'Ibadan':        4.8,
  'Enugu':         4.6,
  'Kaduna':        6.0,
  'Benin City':    4.3,
  'Jos':           5.8,
  'Calabar':       4.2,
  'Uyo':           4.1,
  'Warri':         4.2,
  'Owerri':        4.4,
  'Custom':        5.0,
};

export const LOCATIONS = Object.keys(PEAK_SUN_HOURS);

// ── Engineering constants ─────────────────────────────────────────────────────
const EFF = {
  INVERTER_CABLE:      0.85,   // combined inverter + cable loss
  PANEL_DERATING:      0.80,   // heat + dust (Nigerian climate)
  BATTERY_DOD_LITHIUM: 0.85,
  BATTERY_DOD_OTHER:   0.50,   // tubular / dry-cell
};

// Standard unit sizes — calculator always snaps to these
const PANEL_UNIT_W      = 400;   // 400W panel
const BATTERY_UNIT_AH   = 200;   // 200Ah battery unit
const BATTERY_UNIT_V    = 48;    // default system voltage
const BATTERY_UNIT_KWH  = (BATTERY_UNIT_AH * BATTERY_UNIT_V) / 1000; // 9.6kWh

// Inverter snap-up steps (kVA) — exported so the admin coverage report can
// flag catalog gaps against the sizes the calculator can recommend.
export const INVERTER_STEPS = [1, 2, 3, 5, 7.5, 10, 15, 20];

// Charge controller snap-up steps (A)
const CONTROLLER_STEPS = [20, 30, 40, 60, 80, 100];

// Tier definitions
const TIERS = {
  sufficient:  { panelMult: 1.0, batteryMult: 1.0, inverterBoost: 0, label: 'Sufficient',  description: 'Covers your exact load with no buffer. Good for predictable, consistent usage.' },
  recommended: { panelMult: 1.3, batteryMult: 1.5, inverterBoost: 0, label: 'Recommended', description: 'The sweet spot — 30% more solar and 50% extra battery for cloudy days and load growth.' },
  overkill:    { panelMult: 1.6, batteryMult: 2.0, inverterBoost: 1, label: 'Overkill',    description: 'Built for the long haul. Double battery, 60% more panels, next inverter size up.' },
};

// ============================================================================
// STEP-BY-STEP SIZING FUNCTIONS (all exported for unit tests)
// ============================================================================

/** Total raw Wh/day across all appliances */
export function calcDailyWh(appliances) {
  return appliances.reduce((sum, a) => sum + a.watts * a.qty * a.hours, 0);
}

/** Gross up for inverter + cable losses */
export function calcAdjustedWh(dailyWh) {
  return dailyWh / EFF.INVERTER_CABLE;
}

/** Minimum solar Wp required, after derating */
export function calcGrossWp(adjustedWh, peakSunHours) {
  return adjustedWh / peakSunHours / EFF.PANEL_DERATING;
}

/** Snap Wp to nearest multiple of PANEL_UNIT_W, return count + total */
export function calcPanelCount(grossWp, multiplier = 1) {
  const needed = grossWp * multiplier;
  const count  = Math.max(1, Math.ceil(needed / PANEL_UNIT_W));
  return { count, totalWp: count * PANEL_UNIT_W, unitWp: PANEL_UNIT_W };
}

/**
 * Battery sizing — snap to battery unit multiples
 * Returns both Ah and kWh so admin/customer can see either
 */
export function calcBattery(dailyWh, autonomyHours, batteryType, multiplier = 1) {
  const dod       = batteryType === 'lithium' ? EFF.BATTERY_DOD_LITHIUM : EFF.BATTERY_DOD_OTHER;
  const neededWh  = (dailyWh / 24) * autonomyHours * multiplier;
  const neededKwh = neededWh / 1000 / dod;
  const units     = Math.max(1, Math.ceil(neededKwh / BATTERY_UNIT_KWH));
  return {
    units,
    totalAh:  units * BATTERY_UNIT_AH,
    totalKwh: Math.round(units * BATTERY_UNIT_KWH * 10) / 10,
    unitAh:   BATTERY_UNIT_AH,
    voltage:  BATTERY_UNIT_V,
  };
}

/**
 * Inverter sizing — accounts for surge multipliers per appliance
 * boostSteps bumps to the next standard kVA size for overkill tier
 */
export function calcInverter(appliances, boostSteps = 0) {
  const peakW  = appliances.reduce((sum, a) =>
    sum + a.watts * a.qty * (a.surgeMultiplier ?? 1.0), 0);
  const minKva = (peakW / 1000) * 1.25; // 25% safety headroom
  const baseIdx = INVERTER_STEPS.findIndex(s => s >= minKva);
  const idx     = Math.min(
    baseIdx === -1 ? INVERTER_STEPS.length - 1 : baseIdx + boostSteps,
    INVERTER_STEPS.length - 1,
  );
  return {
    kva:      INVERTER_STEPS[idx],
    minKva:   Math.round(minKva * 10) / 10,
    peakWatts: Math.round(peakW),
  };
}

/** Charge controller — based on panel array Isc */
export function calcController(totalPanelWp, systemVoltage = BATTERY_UNIT_V) {
  const minAmp    = Math.ceil((totalPanelWp / systemVoltage) * 1.25);
  const snappedAmp = CONTROLLER_STEPS.find(s => s >= minAmp)
    ?? CONTROLLER_STEPS[CONTROLLER_STEPS.length - 1];
  return { ampere: snappedAmp, minAmpere: minAmp };
}

/** Daily energy generation from the panel array */
export function calcDailyGenKwh(totalPanelWp, peakSunHours) {
  return Math.round((totalPanelWp / 1000) * peakSunHours * 10) / 10;
}

/** Rough solar contribution % for display */
export function calcSolarContributionPct(solarKwp, peakLoadKw) {
  if (peakLoadKw <= 0) return 0;
  return Math.min(95, Math.round((solarKwp / peakLoadKw) * 60 + 35));
}

// ============================================================================
// COST ESTIMATE RANGE
// Uses admin-configurable rates from solar_settings.
// Returns min and max so we show a range to the customer.
// ============================================================================

export function calcCostRange(inverterKva, batteryKwh, panelWp, settings) {
  const get = (key, fallback) => Number(settings.get(key) ?? fallback);
  const vat  = 1 + get('vat_rate', 7.5) / 100;

  const min = (
    inverterKva * get('inverter_cost_min', 320000) +
    batteryKwh  * get('battery_cost_min',  100000) +
    (panelWp / 1000) * get('panel_cost_min', 80000) +
    get('install_cost_min', 50000)
  ) * vat;

  const max = (
    inverterKva * get('inverter_cost_max', 450000) +
    batteryKwh  * get('battery_cost_max',  150000) +
    (panelWp / 1000) * get('panel_cost_max', 120000) +
    get('install_cost_max', 120000)
  ) * vat;

  return { min: Math.round(min), max: Math.round(max) };
}

// ============================================================================
// ROI / SAVINGS
// ============================================================================

export function calcSavings(costMin, costMax, settings) {
  const get           = (key, fallback) => Number(settings.get(key) ?? fallback);
  const monthlyGrid   = get('monthly_grid_cost', 45000);
  const yearlyGrid    = monthlyGrid * 12;
  const gridSavings   = Math.round(yearlyGrid * 0.85);
  const fuelSavings   = Math.round(yearlyGrid * 0.72);
  const avgCost       = (costMin + costMax) / 2;
  const paybackYears  = gridSavings > 0
    ? parseFloat((avgCost / gridSavings).toFixed(1))
    : null;

  return {
    annualGridSavings: gridSavings,
    annualFuelSavings: fuelSavings,
    paybackYears,
  };
}

// ============================================================================
// MAIN PIPELINE — runs sizing for all three tiers
// ============================================================================

/**
 * @param {object} input
 * @param {Array}  input.appliances  [{ watts, qty, hours, surgeMultiplier? }]
 * @param {string} input.location
 * @param {number} input.autonomyHours
 * @param {string} input.batteryType   'lithium' | 'tubular' | 'dry-cell'
 * @param {Map}    settings            key → value from solar_settings DB rows
 *
 * @returns {object} { metrics, tiers }
 *   metrics  — shared load summary shown on results screen
 *   tiers    — [sufficient, recommended, overkill] each with sizing specs
 *              that the matching service uses to find real products
 */
export function runSizing(input, settings) {
  const { appliances, location, autonomyHours, batteryType } = input;

  const peakSunHours = PEAK_SUN_HOURS[location] ?? PEAK_SUN_HOURS['Custom'];
  const dailyWh      = calcDailyWh(appliances);
  const adjustedWh   = calcAdjustedWh(dailyWh);
  const grossWp      = calcGrossWp(adjustedWh, peakSunHours);

  // Base inverter (shared — overkill just steps up)
  const baseInverter = calcInverter(appliances, 0);

  // Build each tier
  const tiers = Object.entries(TIERS).map(([tierKey, tierDef]) => {
    const panels     = calcPanelCount(grossWp, tierDef.panelMult);
    const battery    = calcBattery(dailyWh, autonomyHours, batteryType, tierDef.batteryMult);
    const inverter   = calcInverter(appliances, tierDef.inverterBoost);
    const controller = calcController(panels.totalWp);
    const dailyGen   = calcDailyGenKwh(panels.totalWp, peakSunHours);
    const solarPct   = calcSolarContributionPct(panels.totalWp / 1000, baseInverter.peakWatts / 1000);
    const cost       = calcCostRange(inverter.kva, battery.totalKwh, panels.totalWp, settings);
    const savings    = calcSavings(cost.min, cost.max, settings);

    return {
      tier:          tierKey,
      label:         tierDef.label,
      description:   tierDef.description,
      isRecommended: tierKey === 'recommended',

      // Component specs — used by SolarMatchingService to find real products
      specs: {
        panels:     { count: panels.count,   totalWp: panels.totalWp,   unitWp: PANEL_UNIT_W },
        battery:    { units: battery.units,  totalAh: battery.totalAh,  totalKwh: battery.totalKwh, unitAh: BATTERY_UNIT_AH, voltage: BATTERY_UNIT_V },
        inverter:   { kva: inverter.kva,     minKva: inverter.minKva    },
        controller: { ampere: controller.ampere                          },
      },

      // Display data
      dailyGenKwh:          dailyGen,
      solarContributionPct: solarPct,
      costMin:              cost.min,
      costMax:              cost.max,
      ...savings,
    };
  });

  return {
    // Shared metrics shown in the results header
    metrics: {
      dailyWh:       Math.round(dailyWh),
      adjustedWh:    Math.round(adjustedWh),
      peakWatts:     baseInverter.peakWatts,
      peakSunHours,
      location,
      autonomyHours,
      batteryType,
    },
    tiers,
  };
}

export { TIERS };