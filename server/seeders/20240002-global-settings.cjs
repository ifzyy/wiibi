"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Seed: Global Settings
// Site-wide configuration: navigation, footer links, contact info.
// ─────────────────────────────────────────────────────────────────────────────

// ── Navigation ────────────────────────────────────────────────────────────────

const MAIN_MENU = [
  { label: "Store",            link: "/store",      hasDropdown: true  },
  { label: "Project",          link: "/projects",   hasDropdown: true  },
  { label: "Solar Calculator", link: "/calculator", hasDropdown: false },
  { label: "Blog",             link: "/blog",       hasDropdown: false },
  { label: "Contact Us",       link: "/contact",    hasDropdown: false },
  { label: "About Us",         link: "/about",      hasDropdown: false },
  { label: "Get a Quote",      link: "/get-quote",  hasDropdown: false },
];

// ── Footer ─────────────────────────────────────────────────────────────────────

const FOOTER_COLUMNS = [
  {
    title: "Products",
    links: [
      { label: "Services",  url: "/services"  },
      { label: "Packages",  url: "/packages"  },
      { label: "Projects",  url: "/projects"  },
      { label: "Store",     url: "/store"     },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", url: "/about"   },
      { label: "Privacy",  url: "/privacy" },
      { label: "Terms",    url: "/terms"   },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Solar Calculator", url: "/calculator" },
      { label: "FAQ",              url: "/faq"        },
      { label: "Blog",             url: "/blog"       },
    ],
  },
];

const FOOTER_SOCIAL_LINKS = {
  tiktok:    "https://tiktok.com/@wiibienergy",
  instagram: "https://instagram.com/wiibienergy",
  whatsapp:  "https://wa.me/2349162102080",
};

const FOOTER_CONTACT_INFO = {
  address: "1, Olaoluwa Street, Off Adebowale Road, Ojodu, Lagos",
  email:   "info@wiibienergy.com",
  phone:   "09162102080",
};

// ── Rows ───────────────────────────────────────────────────────────────────────

const GLOBAL_SETTINGS_ROWS = [
  {
    id:          "gs-nav-links",
    key:         "navigation.main_menu",
    value:       JSON.stringify(MAIN_MENU),
    type:        "text",
    group:       "navigation",
    label:       "Main Navigation Links",
    description: "Links displayed in the header menu",
    is_public:   true,
    is_system:   true,
  },
  {
    id:          "gs-footer-structure",
    key:         "footer.columns",
    value:       JSON.stringify(FOOTER_COLUMNS),
    type:        "text",
    group:       "footer",
    label:       "Footer Columns",
    description: "Multi-column link structure for the footer",
    is_public:   true,
    is_system:   true,
  },
  {
    id:          "gs-footer-socials",
    key:         "footer.social_links",
    value:       JSON.stringify(FOOTER_SOCIAL_LINKS),
    type:        "text",
    group:       "footer",
    label:       "Social Media Links",
    description: "URLs for footer social icons",
    is_public:   true,
    is_system:   true,
  },
  {
    id:          "gs-footer-contact",
    key:         "footer.contact_info",
    value:       JSON.stringify(FOOTER_CONTACT_INFO),
    type:        "text",
    group:       "footer",
    label:       "Footer Contact Details",
    description: "Address and email displayed in the footer branding area",
    is_public:   true,
    is_system:   true,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("global_settings", GLOBAL_SETTINGS_ROWS);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("global_settings", null, {});
  },
};
