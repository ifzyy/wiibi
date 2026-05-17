// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
export const COLORS = {
  ink:        "#1A1102",   // deep brown-black — headers, primary text
  amber:      "#FFAA14",   // amber — accent, CTAs, highlights
  amberLight: "#FFDDA1",   // pale amber — soft highlights, badges
  pageBg:     "#F2F2EE",   // page background
  cardBg:     "#F9F9F9",   // card backgrounds
  surface:    "#F1F1F1",   // hover states
  border:     "#E5E5E5",   // borders, dividers
  borderMid:  "#D9D9D9",   // mid-weight borders
  textSec:    "#606060",   // secondary text, icons
  textMuted:  "#9ca3af",   // placeholder, hints
  white:      "#FFFFFF",

  success:    "#22c55e",
  successBg:  "#f0fdf4",
  successText:"#166534",

  warn:       "#FFAA14",
  warnBg:     "#FFF8EC",
  warnText:   "#7a4f00",

  danger:     "#ef4444",
  dangerBg:   "#fef2f2",
  dangerText: "#991b1b",
  dangerLight:"#fecaca",

  purple:     "#8b5cf6",
  purpleBg:   "#f5f3ff",
  purpleText: "#5b21b6",
};

export const RADIUS = {
  sm:  6,
  md:  8,
  lg:  10,
  xl:  12,
  full: 9999,
};

export const FONT_SIZE = {
  xs:   10,
  sm:   11,
  base: 12,
  md:   13,
  lg:   15,
  xl:   17,
  "2xl":20,
  "3xl":30,
};

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
export const API_BASE = "http://localhost:5000/api";

// ─────────────────────────────────────────────────────────────────────────────
// Stock Status Config
// ─────────────────────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  in_stock:     { label: "In Stock",  dot: COLORS.success, bg: COLORS.successBg, text: COLORS.successText },
  low_stock:    { label: "Low Stock", dot: COLORS.warn,    bg: COLORS.warnBg,    text: COLORS.warnText    },
  out_of_stock: { label: "Sold Out",  dot: COLORS.danger,  bg: COLORS.dangerBg,  text: COLORS.dangerText  },
  pre_order:    { label: "Pre-Order", dot: COLORS.purple,  bg: COLORS.purpleBg,  text: COLORS.purpleText  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Drawer Tabs
// ─────────────────────────────────────────────────────────────────────────────
export const DRAWER_TABS = [
  { id: "info",     label: "Info",     icon: "edit"  },
  { id: "pricing",  label: "Pricing",  icon: "star"  },
  { id: "images",   label: "Images",   icon: "image" },
  { id: "settings", label: "Settings", icon: "eye"   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Blank product form
// ─────────────────────────────────────────────────────────────────────────────
export const BLANK_PRODUCT_FORM = {
  name:              "",
  slug:              "",
  price:             "",
  sale_price:        "",
  stock:             0,
  sku:               "",
  category:          "",
  brand:             "",
  short_description: "",
  description:       "",
  featured_image_url:"",
  is_visible:        true,
  is_featured:       false,
};