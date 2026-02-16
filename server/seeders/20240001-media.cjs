"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Seed: Media
// Images referenced by page sections and global settings.
// ─────────────────────────────────────────────────────────────────────────────

const MEDIA_ROWS = [
  {
    id: "media-hero-bg",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600",
    alt_text: "Modern solar-powered home – hero background",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
  {
    id: "media-cta-bg",
    url: "https://images.unsplash.com/photo-1556155099-490a1ba16284?w=1600",
    alt_text: "Happy family with solar panels – CTA background",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
  {
    id: "media-product-1",
    url: "https://images.unsplash.com/photo-1613665798973-657e3c1473e7?w=800",
    alt_text: "Lithium battery",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
  {
    id: "media-product-2",
    url: "https://images.unsplash.com/photo-1509395596868-d7968f398e39?w=800",
    alt_text: "Hybrid inverter",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
  {
    id: "media-product-3",
    url: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800",
    alt_text: "Smart security camera",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
  {
    id: "media-testimonial-1",
    url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    alt_text: "Customer testimonial 1",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
  {
    id: "media-testimonial-2",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    alt_text: "Customer testimonial 2",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
  {
    id: "media-testimonial-3",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    alt_text: "Customer testimonial 3",
    type: "image",
    filename: "medi-hq",
    mime_type: "image/jpeg",
    size_bytes: 150_000,
    width: 1200,
    height: 800,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("media", MEDIA_ROWS);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("media", null, {});
  },
};
