import { Tv, Laptop, Wind, Sun } from 'lucide-react';

export const MOCK_POWERED_DEVICES = [
  { label: "Tv",     icon: Tv },
  { label: "Laptop", icon: Laptop },
  { label: "Fan",    icon: Wind },
  { label: "Light",  icon: Sun },
];

export const MOCK_TRUST_BADGES = [
  { icon: "🚚", label: "Free shipping" },
  { icon: "🔒", label: "Secure Payment" },
  { icon: "📦", label: "Secure Logistics" },
  { icon: "🛡️", label: "1 year Warranty" },
];

// Package-style: components with sub-specs per component
export const MOCK_PACKAGE_COMPONENTS = [
  {
    name: "SRNE RIC 1KW Uni-directional Inverter",
    qty: 1,
    image: null,
    description:
      "SR-IC Series pure sine wave inverter (high-frequency) has a fast dynamic response, high conversion efficiency, low harmonic component and stable operation. With idle mode, normal mode and energy saving mode optional, the SR-IC Series can maximize battery energy saving based on application scenarios and requirements",
    specs: [
      { label: "Model",                value: "SR-IC12-1RW" },
      { label: "Rated Battery Voltage", value: "12 VDC" },
      { label: "Rated Output Power",    value: "1000KW" },
      { label: "Rated Output Voltage",  value: "200/230/240 VDC" },
      { label: "Output Frequency",      value: "50/60Hz" },
      { label: "Dimension",             value: "390*229*88mm" },
      { label: "Weight",                value: "30KG" },
      { label: "IP Grade",              value: "IP20" },
    ],
  },
  {
    name: "60w Panels",
    qty: 6,
    image: null,
    description:
      "RT6C-M is a robust solar module with 60 solar cells. These modules can be used for on-grid solar applications. Our meticulous design and production techniques ensure a high-yield, long-term performance for every module produced.\nOur rigorous quality control and in-house testing facilities guarantee Restarsolar's modules meet the highest quality standards possible.",
    specs: [
      { label: "Maximum Power",       value: "170W" },
      { label: "Open Circuit Voltage", value: "21.76V" },
      { label: "Max Power Voltage",    value: "18.6V" },
      { label: "Max Power Current",    value: "9.14A" },
      { label: "Cell Type",            value: "Monocrystalline" },
      { label: "Dimension",            value: "390*229*88mm" },
      { label: "Packaging",            value: "5pc per carton" },
    ],
  },
];

// Non-package: flat spec list
export const MOCK_SINGLE_SPECS = [
  { label: "Model",            value: "SR-IC12-1RW" },
  { label: "Voltage",          value: "12 VDC" },
  { label: "Output Power",     value: "1000W" },
  { label: "Output Voltage",   value: "220 VDC" },
  { label: "Frequency",        value: "50/60Hz" },
  { label: "Dimension",        value: "390*229*88mm" },
  { label: "Weight",           value: "30KG" },
  { label: "IP Grade",         value: "IP20" },
];

export const MOCK_REVIEWS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  rating: i % 5 === 3 ? 4 : 5,
  title: "Perfect for my home and finances",
  body: "I have been able to save 50% of my electricity expenses since I purchased this bundle",
  date: "5 May, 2025",
  author: "Johnson",
  verified: true,
}));

export const MOCK_RATING_SUMMARY = {
  average: 4.5,
  total: 500,
  breakdown: { 5: 78, 4: 12, 3: 4, 2: 2, 1: 2 }, // percentages
};
