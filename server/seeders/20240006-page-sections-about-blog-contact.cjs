"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Seed: Page Sections – About, Blog, Contact
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date();

const json = (obj) => JSON.stringify(obj);

// ─────────────────────────────────────────────────────────────────────────────
// About Us
// ─────────────────────────────────────────────────────────────────────────────

const ABOUT_MAIN_CONTENT = {
  brand_info: {
    sub_heading:  "Meet the team",
    main_heading: "About Us",
    brand_name:   "Wiibi",
    location:     "Lagos, Nigeria",
  },
  hero_section: {
    display_title: "Hive of Innovation",
    main_image:    "media-hive-innovation",
  },
  pillars: [
    {
      main_heading: "Hands on Service",
      sub_headings: ["Professionalism", "Delivery"],
      support_text: "By replacing fossil-fuel-based power sources, our installations measurably reduce greenhouse gas emissions.",
      main_image:   "media-hands-on-service",
    },
    {
      main_heading: "We Care",
      icon:         "leaf-icon",
      support_text: "By replacing fossil-fuel-based power sources, our installations measurably reduce greenhouse gas emissions.",
      main_image:   "media-environmental-care",
      bg_color:     "#F9FFF2",
    },

  ],
  staff_header:{
      main_heading: "Our Leadership",
      sub_headings: ["Visionaries", "Focused"],
      support_text: "By replacing fossil-fuel-based power sources, our installations measurably reduce greenhouse gas emissions.",
      main_image:   "media-leadership-team",
  },
  staff_grid: [
    { name: "Staff Name", role: "Staff Role", image: "media-staff-1" },
    { name: "Staff Name", role: "Staff Role", image: "media-staff-2" },
    { name: "Staff Name", role: "Staff Role", image: "media-staff-3" },
    { name: "Staff Name", role: "Staff Role", image: "media-staff-4" },
    { name: "Staff Name", role: "Staff Role", image: "media-staff-5" },
    { name: "Staff Name", role: "Staff Role", image: "media-staff-6" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Blog
// ─────────────────────────────────────────────────────────────────────────────

const BLOG_GRID_CONTENT = {
  header: {
    sub_heading:  "Our Voice",
    main_heading: "Blog",
  },
  categories: [
    "All",
    "Solar & Energy Education",
    "Product Guides",
    "How-Tos",
    "Installation",
    "Case Study",
    "Company News",
  ],
  posts: [
    {
      id:       1,
      category: "Solar & Energy Education",
      title:    "How Solar Power works in Nigerian Homes",
      slug:     "how-solar-power-works-nigerian-homes",
      excerpt:  "Solar power in Nigerian homes works by converting sunlight into electricity through solar panels, storing excess energy in batteries, and supplying power through an inverter when needed.",
      main_image: "media-blog-solar-how-to",
      author: {
        name:   "Charles",
        avatar: "media-author-charles",
        date:   "6th Feb, 2026",
      },
    },
    {
      id:       2,
      category: "Product Guides",
      title:    "How Solar Power works in Nigerian Homes",
      slug:     "solar-power-product-guide",
      excerpt:  "Solar power in Nigerian homes works by converting sunlight into electricity through solar panels, storing excess energy in batteries, and supplying power through an inverter when needed.",
      main_image: "media-blog-product-guide",
      author: {
        name:   "Charles",
        avatar: "media-author-charles",
        date:   "6th Feb, 2026",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Contact
// ─────────────────────────────────────────────────────────────────────────────

const CONTACT_MAIN_CONTENT = {
  header: {
    sub_heading:   "Get In touch",
    main_heading:  "Contact Us",
    display_title: "Let us know how we can help",
  },
  connect_info: {
    section_title: "Connect with Us",
    contact_methods: [
      {
        label:  "Phone Number",
        values: ["0802 345 567", "0802 345 567"],
      },
    ],
  },
  visit_info: {
    section_title: "Visit Us",
    address:       "1, Olaoluwa Street Off Adebowale Road, Ojodu",
    map_data: {
      center_location: "Ojodu",
      main_image:      "media-contact-map-location",
      markers:         ["Isheri", "Berger Bus-Stop"],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Rows
// ─────────────────────────────────────────────────────────────────────────────

const MISC_SECTIONS_ROWS = [
  // About
  {
    id:            "sec-about-us-main",
    page_id:       "page-about",
    section_type:  "about_hero",
    display_order: 10,
    is_visible:    true,
    content:       json(ABOUT_MAIN_CONTENT),
    created_at:    now,
    updated_at:    now,
  },

  // Blog
  {
    id:            "sec-blog-main",
    page_id:       "page-blog",
    section_type:  "blog_grid",
    display_order: 10,
    is_visible:    true,
    content:       json(BLOG_GRID_CONTENT),
    created_at:    now,
    updated_at:    now,
  },

  // Contact
  {
    id:            "sec-contact-us-main",
    page_id:       "page-contact",
    section_type:  "main",
    display_order: 10,
    is_visible:    true,
    content:       json(CONTACT_MAIN_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("page_sections", MISC_SECTIONS_ROWS);
  },

  async down(queryInterface) {
    const ids = MISC_SECTIONS_ROWS.map((r) => r.id);
    await queryInterface.bulkDelete("page_sections", { id: ids }, {});
  },
};
