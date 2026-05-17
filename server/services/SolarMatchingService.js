/**
 * services/SolarMatchingService.js
 *
 * Queries your real product catalog to find the best matching product
 * for each solar component type.
 *
 * Matching uses solar_component_type + solar_specs JSON:
 *
 *   inverter         → solar_specs.kva >= required kva (snap up, not down)
 *   battery          → solar_specs.ah  >= required ah per unit
 *                      solar_specs.chemistry matches batteryType
 *   solar-panel      → solar_specs.watts >= unit watt size
 *   charge-controller→ solar_specs.ampere >= required ampere
 *
 * Out-of-stock strategy:
 *   1. Look for in-stock exact match first
 *   2. If out-of-stock, look for in-stock product that's one size up
 *   3. If nothing in stock at all, return the best match with out-of-stock flag
 *   Never silently drop a component — always return something with a clear status
 */

import db from '../models/index.js';

// Product attributes we need for recommendation display
const PRODUCT_ATTRS = [
  'id', 'name', 'slug', 'price', 'sale_price',
  'stock', 'featured_image_url', 'short_description',
  'solar_component_type', 'solar_specs', 'brand',
  'is_visible',
];

// ── Matching helpers ──────────────────────────────────────────────────────────

/**
 * Generic finder — fetches candidates by component type, scores them,
 * applies out-of-stock fallback logic.
 *
 * @param {string}   componentType  — 'inverter' | 'battery' | 'solar-panel' | 'charge-controller'
 * @param {Function} scoreFn        — (product) => number. Higher = better match. -1 = disqualified.
 * @returns {object} matched product with meta fields attached
 */
async function findBest(componentType, scoreFn) {
  const candidates = await db.Product.findAll({
    where: {
      solar_component_type: componentType,
      is_visible:           true,
    },
    attributes: PRODUCT_ATTRS,
    order: [
      ['stock',       'DESC'],  // in-stock first
      ['is_featured', 'DESC'],  // featured next
      ['price',       'ASC'],   // cheapest otherwise
    ],
    limit: 30, // never need more than this per type
  });

  if (!candidates.length) return null;

  // Score every candidate, discard disqualified ones (score -1)
  const scored = candidates
    .map(p => {
      const specs = p.solar_specs ?? {};
      const score = scoreFn(specs);
      return { p, score };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => {
      // Primary: best score (lowest overshoot — closest adequate match)
      if (a.score !== b.score) return a.score - b.score;
      // Secondary: in-stock before out-of-stock
      const aStock = a.p.stock > 0 ? 0 : 1;
      const bStock = b.p.stock > 0 ? 0 : 1;
      return aStock - bStock;
    });

  if (!scored.length) {
    // Nothing qualifies — return best available as fallback with a flag
    const fallback = candidates[0];
    return fallback ? formatProduct(fallback, true, true) : null;
  }

  // Prefer in-stock; if best match is out of stock, check if next size up is in stock
  const best        = scored[0].p;
  const inStockBest = scored.find(({ p }) => p.stock > 0)?.p;

  if (best.stock > 0) {
    return formatProduct(best, false, false);
  }

  if (inStockBest) {
    // Suggest in-stock upsell instead — note it to the customer
    return formatProduct(inStockBest, false, false, true);
  }

  // Nothing in stock — return best match with clear out-of-stock flag
  return formatProduct(best, false, true);
}

/**
 * Format a matched product into a consistent component shape.
 *
 * @param {object}  product
 * @param {boolean} isFallback    — no spec match found, this is category-only fallback
 * @param {boolean} isOutOfStock  — returned with out-of-stock flag
 * @param {boolean} isUpsell      — in-stock but bumped up one size
 */
function formatProduct(product, isFallback, isOutOfStock, isUpsell = false) {
  const unitPrice = Number(product.sale_price ?? product.price);
  return {
    found:       true,
    isFallback,
    isOutOfStock,
    isUpsell,
    stockStatus: isOutOfStock ? 'out_of_stock' : 'available',
    // Product fields
    id:          product.id,
    name:        product.name,
    slug:        product.slug,
    brand:       product.brand,
    image:       product.featured_image_url,
    description: product.short_description,
    unitPrice,
    specs:       product.solar_specs,
  };
}

/** Returned when no products exist for a component type at all */
function notFound(componentType) {
  return {
    found:       false,
    isOutOfStock: false,
    stockStatus: 'not_in_catalog',
    message:     `No ${componentType} products found. Add products with solar_component_type = '${componentType}' to populate this.`,
  };
}

// ── Per-type matchers ─────────────────────────────────────────────────────────

/**
 * Find inverter — match kva >= required, score = overshoot (lower = better)
 */
async function matchInverter(requiredKva) {
  const result = await findBest('inverter', (specs) => {
    const kva = Number(specs.kva ?? 0);
    if (kva < requiredKva) return -1;          // undersized = disqualified
    return kva - requiredKva;                   // score = overshoot
  });
  return result ?? notFound('inverter');
}

/**
 * Find battery — match ah >= UNIT_AH, chemistry matches batteryType
 * We're matching per-unit: the caller handles qty multiplication
 */
async function matchBattery(unitAh, batteryType) {
  const result = await findBest('battery', (specs) => {
    const ah        = Number(specs.ah ?? 0);
    const chemistry = specs.chemistry ?? '';

    // Chemistry must match what user selected (lithium vs tubular/dry-cell)
    // 'tubular' and 'dry-cell' are both non-lithium — treat interchangeably
    const isLithium    = chemistry === 'lithium';
    const wantsLithium = batteryType === 'lithium';
    if (isLithium !== wantsLithium) return -1;   // wrong chemistry = disqualified

    if (ah < unitAh) return -1;                  // undersized = disqualified
    return ah - unitAh;                          // score = overshoot
  });
  return result ?? notFound('battery');
}

/**
 * Find solar panel — match watts >= unit watts
 */
async function matchPanel(unitWatts) {
  const result = await findBest('solar-panel', (specs) => {
    const w = Number(specs.watts ?? 0);
    if (w < unitWatts) return -1;
    return w - unitWatts;
  });
  return result ?? notFound('solar-panel');
}

/**
 * Find charge controller — match ampere >= required
 */
async function matchController(requiredAmpere) {
  const result = await findBest('charge-controller', (specs) => {
    const a = Number(specs.ampere ?? 0);
    if (a < requiredAmpere) return -1;
    return a - requiredAmpere;
  });
  return result ?? notFound('charge-controller');
}

// ============================================================================
// BUILD ONE TIER'S RECOMMENDATION
// ============================================================================

/**
 * Given a tier's sizing specs, find matching products and compute totals.
 *
 * @param {object} tierSizing   — tier object from SolarCalculatorService.runSizing()
 * @param {string} batteryType
 * @returns {object} complete tier recommendation with products + totals
 */
export async function buildTierRecommendation(tierSizing, batteryType) {
  const { specs } = tierSizing;

  // Run all four product lookups in parallel
  const [panelMatch, batteryMatch, inverterMatch, controllerMatch] = await Promise.all([
    matchPanel(specs.panels.unitWp),
    matchBattery(specs.battery.unitAh, batteryType),
    matchInverter(specs.inverter.kva),
    matchController(specs.controller.ampere),
  ]);

  // Build component line items with quantities
  const components = [
    buildLineItem(panelMatch,      specs.panels.count,   'solar-panel',        'Solar Panels'),
    buildLineItem(batteryMatch,    specs.battery.units,  'battery',            'Battery Bank'),
    buildLineItem(inverterMatch,   1,                    'inverter',           'Inverter'),
    buildLineItem(controllerMatch, 1,                    'charge-controller',  'Charge Controller'),
  ];

  // Totals — only include components that were found
  const foundComponents  = components.filter(c => c.found);
  const subtotal         = foundComponents.reduce((sum, c) => sum + (c.lineTotal ?? 0), 0);
  const vatAmount        = subtotal * 0.075;
  const productTotal     = Math.round(subtotal + vatAmount);

  // Stock status summary
  const allAvailable  = components.every(c => !c.found || c.stockStatus === 'available');
  const someAvailable = components.some(c => c.found && c.stockStatus === 'available');
  const overallStock  = allAvailable ? 'available' : someAvailable ? 'partial' : 'unavailable';

  return {
    tier:          tierSizing.tier,
    label:         tierSizing.label,
    description:   tierSizing.description,
    isRecommended: tierSizing.isRecommended,

    // Sizing specs for display
    specs:                tierSizing.specs,
    dailyGenKwh:          tierSizing.dailyGenKwh,
    solarContributionPct: tierSizing.solarContributionPct,

    // Products
    components,

    // Totals
    subtotal:     Math.round(subtotal),
    vatAmount:    Math.round(vatAmount),
    productTotal,

    // Note: productTotal is from store prices, costMin/costMax is the estimate range
    // Both shown to customer — store price is exact, estimate covers installation etc.
    costMin:      tierSizing.costMin,
    costMax:      tierSizing.costMax,

    // Savings + ROI
    annualGridSavings: tierSizing.annualGridSavings,
    annualFuelSavings: tierSizing.annualFuelSavings,
    paybackYears:      tierSizing.paybackYears,

    // Stock
    overallStockStatus: overallStock,
  };
}

/**
 * Build a single component line item.
 */
function buildLineItem(match, qty, componentType, displayLabel) {
  if (!match.found) {
    return {
      found:         false,
      componentType,
      displayLabel,
      qty,
      stockStatus:   match.stockStatus,
      message:       match.message,
    };
  }

  return {
    found:         true,
    componentType,
    displayLabel,
    qty,
    stockStatus:   match.stockStatus,
    isOutOfStock:  match.isOutOfStock,
    isUpsell:      match.isUpsell,
    isFallback:    match.isFallback,

    // Product details
    id:          match.id,
    name:        match.name,
    slug:        match.slug,
    brand:       match.brand,
    image:       match.image,
    description: match.description,
    unitPrice:   match.unitPrice,
    lineTotal:   match.unitPrice * qty,

    // Stock notice for UI
    stockNotice: match.isOutOfStock
      ? 'Currently out of stock — our team will confirm availability when they follow up'
      : match.isUpsell
      ? 'Upgraded to next available size — currently in stock'
      : null,
  };
}

// ============================================================================
// BUILD ALL THREE TIERS
// ============================================================================

/**
 * Build all three tier recommendations in parallel.
 *
 * @param {object} sizing       — output of runSizing()
 * @param {string} batteryType
 * @returns {Array} [sufficient, recommended, overkill]
 */
export async function buildAllRecommendations(sizing, batteryType) {
  return Promise.all(
    sizing.tiers.map(tier => buildTierRecommendation(tier, batteryType)),
  );
}