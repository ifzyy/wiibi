"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Seed: Pages
// All public-facing pages for the Wiibi Energy website.
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date();

const PAGES_ROWS = [
  {
    id:               "page-home",
    title:            "Home",
    slug:             "home",
    status:           "published",
    meta_title:       "Wiibi Energy – Reliable Solar & Backup Power Solutions",
    meta_description: "Professional solar installations, inverters, batteries and smart home solutions in Nigeria.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-services",
    title:            "Services",
    slug:             "services",
    status:           "published",
    meta_title:       "Our Solar & Energy Services – Wiibi Energy",
    meta_description: "Expert solar system design, installation, maintenance and smart home integration across Nigeria.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-packages",
    title:            "Packages",
    slug:             "packages",
    status:           "published",
    meta_title:       "Solar Packages – Wiibi Energy",
    meta_description: "Affordable, ready-to-install solar packages for homes and businesses in Nigeria.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-projects",
    title:            "Projects",
    slug:             "projects",
    status:           "published",
    meta_title:       "Our Solar Projects – Wiibi Energy",
    meta_description: "Completed solar installations, case studies and client projects across Nigeria.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-blog",
    title:            "Blog",
    slug:             "blog",
    status:           "published",
    meta_title:       "Solar Energy Blog – Wiibi Energy",
    meta_description: "Latest solar tips, product guides, installation walk-throughs and energy-saving advice.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-contact",
    title:            "Contact Us",
    slug:             "contact",
    status:           "published",
    meta_title:       "Contact Wiibi Energy – Solar Solutions Nigeria",
    meta_description: "Get in touch for solar quotes, support or inquiries. Call 09162102080 or email info@wiibienergy.com.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-about",
    title:            "About Us",
    slug:             "about",
    status:           "published",
    meta_title:       "About Wiibi Energy – Powering Nigeria with Solar",
    meta_description: "Learn who we are, our mission, vision and commitment to reliable renewable energy in Nigeria.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-get-quote",
    title:            "Get a Quote",
    slug:             "get-quote",
    status:           "published",
    meta_title:       "Request Solar Quote – Wiibi Energy",
    meta_description: "Get a free, no-obligation solar system quote tailored to your home or business needs.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-calculator",
    title:            "Solar Calculator",
    slug:             "solar-calculator",
    status:           "published",
    meta_title:       "Solar Calculator – Estimate Your System Size",
    meta_description: "Calculate how much solar power you need based on your appliances and location in Nigeria.",
    created_at:       now,
    updated_at:       now,
  },
  {
    id:               "page-store",
    title:            "Online Store",
    slug:             "store",
    status:           "published",
    meta_title:       "Solar & Smart Products Store – Wiibi Energy",
    meta_description: "Buy batteries, inverters, CCTV, smart devices, smart locks and more online.",
    created_at:       now,
    updated_at:       now,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("pages", PAGES_ROWS);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("pages", null, {});
  },
};
