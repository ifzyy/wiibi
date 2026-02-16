"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Seed: Page Sections – Home
// All content sections for the homepage (page-home).
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date();

// ── Helper: stringify nested content objects consistently ─────────────────────
const json = (obj) => JSON.stringify(obj);

// ─────────────────────────────────────────────────────────────────────────────
// Section content definitions
// (kept as plain objects for readability; serialised below in ROWS)
// ─────────────────────────────────────────────────────────────────────────────

const HERO_CONTENT = {
  title:              "Lower your energy bills with solar",
  subtitle:           "Renewable energy for africa",
  main_support_text:  "Reliable, affordable, and sustainable solar solutions for homes and businesses.",
  main_button_text:   "Get a Quote",
  main_button_link:   "/get-quote",
  second_support_text:"Our work supports the transition to cleaner and more reliable power.",
  button2_text:       "learn more",
  button2_link:       "tel:09162102080",
  hero_image:         "media-hero-01",
  // Bottom bar
  question_text:      "HOW MUCH DO YOU SPEND ON POWER?",
  confidence_text:    "Lets fix your expenses",
  calculator_label:   "Solar Calculator",
  initial_amount:     "₦125,000",
};

const STORE_PREVIEW_CONTENT = {
  title:       "Online Store",
  heading:     "Go Solar",
  sub_heading: "Save more energy with our smart product",
  products: [
    {
      name:             "Lithium Battery 5kWh",
      description:      "Track power usage of any appliance",
      price:            "₦850,000",
      image_id:         "media-product-3",
      link:             "/store/lithium-battery-5kwh",
      buy_button_text:  "Buy Now",
      but_button_link:  "/store/buy-lithium",
    },
    {
      name:             "5kVA Hybrid Inverter",
      description:      "Track power usage of any appliance",
      price:            "₦1,250,000",
      image_id:         "media-product-3",
      link:             "/store/5kva-hybrid-inverter",
      buy_button_text:  "Buy Now",
      but_button_link:  "/store/buy-lithium",
    },
    // TODO: replace these placeholders with real distinct products
    ...Array(6).fill(null).map(() => ({
      name:            "Smart CCTV Camera",
      description:     "Track power usage of any appliance",
      price:           "₦145,000",
      image_id:        "media-product-3",
      link:            "/store/smart-cctv-camera",
      buy_button_text: "Buy Now",
      but_button_link: "/store/buy-lithium",
    })),
  ],
  button_text: "open store",
  button_link: "/store",
};

const STATS_CONTENT = {
  title:          "Our results speak for us",
  heading:        "So far so Good",
  paragraph_text: "Our installations continue to perform within expected design parameters across deployed systems. Results to date validate our engineering approach and execution standards.",
  button_text:    "See project",
  button_link:    "/projects",
  stats: [
    {
      label:       "Homes powered",
      value:       "127+",
      description: "We've successfully designed and installed solar systems for households across urban and off-grid communities.",
    },
    {
      label:       "Total Installed Capacity",
      value:       "127MWp",
      description: "Our projects account for multiple megawatts of installed solar capacity across distributed energy systems.",
    },
    {
      label:       "Homes upgraded",
      value:       "99.8%",
      description: "Our projects account for multiple megawatts of installed solar capacity across distributed energy systems.",
    },
    {
      label:       "carbon dioxide offset",
      value:       "6200+ tons",
      description: "By replacing fossil-fuel-based power sources, our installations measurably reduce greenhouse gas emissions.",
    },
    {
      label:       "average uptime",
      value:       "99.9%",
      description: "Engineered for reliability, our systems deliver consistent power with minimal downtime.",
    },
    {
      label:       "Typical ROI",
      value:       "3-5 years",
      description: "Most customers recover their investment within three to five years through energy savings.",
    },
  ],
};

const BLOG_TEASER_CONTENT = {
  title:       "Our Voice",
  heading:     "Our Blog",
  sub_heading: "We document system design decisions, performance insights, and lessons from the field. Our blog focuses on practical knowledge drawn from real installations.",
  posts: [
    {
      title:    "Lithium vs Tubular Batteries: Which is Best for Nigeria?",
      excerpt:  "A detailed comparison of battery types for solar systems in our climate.",
      image_id: "media-hero-01",
      link:     "/blog/lithium-vs-tubular",
    },
    {
      title:    "How to Reduce Your Electricity Bill by 70%",
      excerpt:  "Practical tips for energy saving in Nigerian homes.",
      image_id: "media-stats-01",
      link:     "/blog/reduce-electricity-bill",
    },
    {
      title:    "Smart Home Security on a Budget",
      excerpt:  "Affordable CCTV and smart lock setups that work.",
      image_id: "media-product-3",
      link:     "/blog/smart-home-security-budget",
    },
  ],
  button_text: "See all Articles",
  button_link: "/blog",
};

const TESTIMONIALS_CONTENT = {
  title:       "Testimonials",
  heading:     "Meet Our Clients",
  sub_heading: "We work with homeowners, businesses, and institutions that require reliable power solutions. Each project reflects specific operational needs and constraints.",
  button_text: "Request a Quote",
  button_link: "/quote",
  testimonials: [
    {
      name:        "Aisha O.",
      location:    "Lagos",
      text:        "Wiibi installed a 5kVA system for my duplex. No more generator noise!",
      image_id:    "media-testimonial-1",
      button_text: "See full case study",
      button_link: "/full",
    },
    {
      name:        "Chinedu M.",
      location:    "Abuja",
      text:        "The lithium batteries are holding up very well even during rainy season.",
      image_id:    "media-testimonial-2",
      button_text: "See full case study",
      button_link: "/full",
    },
    {
      name:        "Fatima K.",
      location:    "Port Harcourt",
      text:        "Professional team, fast installation, and great after-sales support.",
      image_id:    "media-testimonial-3",
      button_text: "See full case study",
      button_link: "/full",
    },
  ],
};

const FAQ_TEASER_CONTENT = {
  title:               "Frequently asked Questions",
  heading:             "Questions We've been asked",
  sub_heading:         "For clarity and inquiries. reach out to us",
  button_text_one:     "request a quote",
  button_text_one_link:"/link",
  button_text_two:     "request a quote",
  button_text_two_link:"/link",
  faqs: [
    {
      question: "How long do solar panels last?",
      answer:   "Most high-quality panels come with 25–30 year performance warranties.",
    },
    {
      question: "Do solar systems work during rainy season?",
      answer:   "Yes, though production is lower. Batteries and grid/hybrid systems ensure power availability.",
    },
    {
      question: "What is the payback period in Nigeria?",
      answer:   "Typically 5–7 years depending on system size and usage.",
    },
    {
      question: "Can I start small and expand later?",
      answer:   "Yes – our systems are modular and can be expanded easily.",
    },
  ],
};

const CTA_CONTENT = {
  title:               "optimize",
  heading_one:         "Smart Living",
  heading_two:         "Happy Living",
  button_text:         "request a Quote",
  button_link:         "/get-quote",
  background_image_id: "media-cta-bg",
};

const FOOTER_CONTENT = {
  phone:   "09162102080",
  address: "1, Olaoluwa Street, Off Adebowale Road, Ojodu, Lagos",
  website: "www.wiibienergy.com",
  social: {
    facebook:  "https://facebook.com/wiibienergy",
    instagram: "https://instagram.com/wiibienergy",
    twitter:   "https://twitter.com/wiibienergy",
  },
  copyright: "© 2025 Wiibi Energy. All rights reserved.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Rows
// display_order increments by 10 to allow future sections to be inserted.
// ─────────────────────────────────────────────────────────────────────────────

const HOME_SECTIONS_ROWS = [
  {
    id:            "sec-home-hero",
    page_id:       "page-home",
    section_type:  "hero",
    display_order: 10,
    is_visible:    true,
    content:       json(HERO_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-home-store",
    page_id:       "page-home",
    section_type:  "store-preview",
    display_order: 20,
    is_visible:    true,
    content:       json(STORE_PREVIEW_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-home-stats",
    page_id:       "page-home",
    section_type:  "stats",
    display_order: 30,
    is_visible:    true,
    content:       json(STATS_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-home-blog",
    page_id:       "page-home",
    section_type:  "blog-teaser",
    display_order: 40,
    is_visible:    true,
    content:       json(BLOG_TEASER_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-home-testimonials",
    page_id:       "page-home",
    section_type:  "testimonials",
    display_order: 50,
    is_visible:    true,
    content:       json(TESTIMONIALS_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-home-faq",
    page_id:       "page-home",
    section_type:  "faq-teaser",
    display_order: 60,
    is_visible:    true,
    content:       json(FAQ_TEASER_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-home-cta",
    page_id:       "page-home",
    section_type:  "cta",
    display_order: 70,
    is_visible:    true,
    content:       json(CTA_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-home-footer",
    page_id:       "page-home",
    section_type:  "footer",
    display_order: 80,
    is_visible:    true,
    content:       json(FOOTER_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("page_sections", HOME_SECTIONS_ROWS);
  },

  async down(queryInterface) {
    const ids = HOME_SECTIONS_ROWS.map((r) => r.id);
    await queryInterface.bulkDelete("page_sections", { id: ids }, {});
  },
};
