"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Seed: Page Sections – Store
//
// Inserts the initial configuration for the Store page into `page_sections`.
// Pattern mirrors the existing home-page seed (sec-home-* rows).
//
// Admin workflow:
//   1. Run this seed once → row `sec-store-config` is created.
//   2. StorePageEditor reads:
//        GET /api/page-sections?page_id=page-store&section_type=store-config
//   3. StorePageEditor writes:
//        PATCH /api/page-sections/sec-store-config  { content: { ... } }
// ─────────────────────────────────────────────────────────────────────────────

const now  = new Date();
const json = (obj) => JSON.stringify(obj);

// ─────────────────────────────────────────────────────────────────────────────
// 1. BANNER SLIDES
//
// Each slide maps 1-to-1 with the BANNER_SLIDES array in StorePage.jsx.
//
// image      → null means the gradient is used; set to a URL for a photo bg
// cta.href   → navigates to a route; omit/null to use cta.filter instead
// cta.filter → object passed directly to setFilters() on the store page
// ─────────────────────────────────────────────────────────────────────────────

const BANNER_SLIDES = [
  {
    id:      "slide-1",
    tag:     "Solar Energy Store",
    heading: "Power your world.\nBuild your future.",
    sub:     "Premium solar panels, inverters & batteries — everything you need in one place.",
    cta:     { label: "Shop All Products", filter: {} },
    accent:  "#FFAA14",
    bg:      "from-[#0C0901] via-[#1a1200] to-[#2a1f00]",
    image:   null,
    decorators: [
      { size: 220, x: "right-[-40px]", y: "top-[-60px]",    opacity: 0.08, blur: 60 },
      { size: 120, x: "right-[120px]", y: "bottom-[-30px]", opacity: 0.12, blur: 40 },
      { size:  80, x: "right-[60px]",  y: "top-[40px]",     opacity: 0.06, blur: 30 },
    ],
  },
  {
    id:      "slide-2",
    tag:     "New Arrivals",
    heading: "Next-gen inverters.\nJust landed.",
    sub:     "Lithium-powered, whisper-quiet, and built for Nigerian weather.",
    cta:     { label: "See New Arrivals", filter: { sort: "newest" } },
    accent:  "#22d3ee",
    bg:      "from-[#020f14] via-[#041c24] to-[#06303e]",
    image:   null,
    decorators: [
      { size: 200, x: "right-[-20px]", y: "top-[-50px]",    opacity: 0.10, blur: 60 },
      { size: 100, x: "right-[140px]", y: "bottom-[-20px]", opacity: 0.08, blur: 35 },
    ],
  },
  {
    id:      "slide-3",
    tag:     "Top Picks",
    heading: "Our most-loved\nsolar setups.",
    sub:     "Hand-picked by our engineers for reliability, value, and long life.",
    cta:     { label: "View Featured", filter: { is_featured: "true" } },
    accent:  "#a78bfa",
    bg:      "from-[#0d0614] via-[#160922] to-[#1e0d30]",
    image:   null,
    decorators: [
      { size: 240, x: "right-[-60px]", y: "top-[-80px]",    opacity: 0.09, blur: 70 },
      { size:  90, x: "right-[100px]", y: "bottom-[-10px]", opacity: 0.07, blur: 30 },
    ],
  },
  {
    id:      "slide-4",
    tag:     "Solar Calculator",
    heading: "Not sure what\nyou need?",
    sub:     "Answer 3 questions and get a tailored solar recommendation instantly.",
    cta:     { label: "Use Solar Calculator", href: "/calculator" },
    accent:  "#4ade80",
    bg:      "from-[#010f07] via-[#031a0d] to-[#042e14]",
    image:   null,
    decorators: [
      { size: 180, x: "right-[-30px]", y: "top-[-40px]",    opacity: 0.10, blur: 55 },
      { size: 110, x: "right-[160px]", y: "bottom-[-20px]", opacity: 0.07, blur: 40 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORIES
//
// slug  → the raw category value on Product rows (never changes; used as filter key)
// label → display name shown in the sidebar (blank = auto-capitalise slug)
//
// Order here = order in the sidebar.
// Any product categories NOT listed here will appear after these, alphabetically.
//
// Populate with your actual product category slugs before seeding.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: "solar-panels",  label: "Solar Panels"  },
  { slug: "inverters",     label: "Inverters"     },
  { slug: "batteries",     label: "Batteries"     },
  { slug: "accessories",   label: "Accessories"   },
  { slug: "lighting",      label: "Lighting"      },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. PRICE PRESETS
// Mirrors PRICE_PRESETS in StorePage.jsx.
// ─────────────────────────────────────────────────────────────────────────────

const PRICE_PRESETS = [
  { label: "Under ₦500k",  min: "",         max: "500000"    },
  { label: "₦500k – ₦1M", min: "500000",   max: "1000000"   },
  { label: "₦1M – ₦3M",   min: "1000000",  max: "3000000"   },
  { label: "₦3M – ₦10M",  min: "3000000",  max: "10000000"  },
  { label: "Over ₦10M",   min: "10000000", max: ""          },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. SORT OPTIONS
// Mirrors SORT_OPTIONS in StorePage.jsx.
// value keys are consumed by the backend API; only labels are admin-editable.
// ─────────────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "",           label: "Default"           },
  { value: "newest",     label: "Newest"            },
  { value: "featured",   label: "Featured"          },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "name_asc",   label: "A → Z"             },
  { value: "name_desc",  label: "Z → A"             },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. STORE METADATA
// Free-form copy for the store UI (sidebar help card, product grid heading).
// ─────────────────────────────────────────────────────────────────────────────

const STORE_META = {
  heading:     "All Products",
  helpHeading: "Find your solar setup",
  helpCta:     "Use Solar Calculator",
  helpLink:    "/calculator",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED CONFIG — single `page_sections` row
//
// section_type: "store-config" is the agreed API contract.
// The editor reads/writes this one row; if you later need per-section rows,
// split content here and update the API loader accordingly.
// ─────────────────────────────────────────────────────────────────────────────

const STORE_CONFIG_CONTENT = {
  slides:       BANNER_SLIDES,
  categories:   CATEGORIES,
  pricePresets: PRICE_PRESETS,
  sortOptions:  SORT_OPTIONS,
  meta:         STORE_META,
};

const STORE_SECTIONS_ROWS = [
  {
    id:            "sec-store-config",
    page_id:       "page-store",
    section_type:  "store-config",
    display_order: 10,
    is_visible:    true,
    content:       json(STORE_CONFIG_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATION
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("page_sections", STORE_SECTIONS_ROWS);
  },

  async down(queryInterface) {
    const ids = STORE_SECTIONS_ROWS.map((r) => r.id);
    await queryInterface.bulkDelete("page_sections", { id: ids }, {});
  },
};