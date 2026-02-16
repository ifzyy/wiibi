"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Seed: Page Sections – Services
// All content sections for the Services page (page-services).
// ─────────────────────────────────────────────────────────────────────────────

const now = new Date();

const json = (obj) => JSON.stringify(obj);

// ─────────────────────────────────────────────────────────────────────────────
// Section content definitions
// ─────────────────────────────────────────────────────────────────────────────

const SERVICES_HERO_CONTENT = {
  title:    "How we meet your needs",
  subtitle: "Our Services",
};

const SERVICES_MAIN_CONTENT = {
  main_steps: [
    {
      main_image:   "media-site-inspection",
      main_heading: "Site Inspection and checklist",
      support_text: "Our site inspection ensures your installation is custom-engineered for your specific home. We don't do 'one size fits all'—we do 'built for you.'",
    },
    {
      main_image:   "media-personalized-design",
      main_heading: "Personalized design systems",
      support_text: "A random setup covers your roof; a personalized design powers your life. Experience the difference of a system tailored to your specific energy footprint.",
    },
    {
      main_image:   "media-professional-installation",
      main_heading: "Professional Installation",
      support_text: "Our certified engineers ensure your array isn't just an addition to your roof—it's a structurally integrated asset. Each mount is precision-torqued to withstand extreme wind loads, protecting both your energy independence and your home.",
    },
    {
      main_image:   "media-systems-commissioning",
      main_heading: "Systems and Commissioning",
      support_text: "We conclude every project with rigorous multi-point commissioning, translating physical installation into peak operational performance through real-time data validation.",
    },
  ],
};

const WORK_WITH_US_CONTENT = {
  header: {
    sub_heading:  "Get Started",
    main_heading: "Work with Us",
  },
  process_steps: [
    {
      step_number:  "1",
      icon:         "icon-facility-audit",
      heading:      "The Facility Audit",
      support_text: "We analyze your property and your business goals to ensure your solar transition is built for maximum savings and zero wasted space.",
    },
    {
      step_number:  "2",
      icon:         "icon-project-consultation",
      heading:      "The Project Consultation",
      support_text: "We review your energy usage and business schedule to show you exactly how a custom system will handle your peak power needs and lower your bills.",
    },
    {
      step_number:  "3",
      icon:         "icon-operational-proposal",
      heading:      "The Operational Proposal",
      support_text: "We provide a clear financial plan that shows your total savings, available tax incentives, and a guaranteed timeline for a hassle-free setup.",
    },
    {
      step_number:  "4",
      icon:         "icon-infrastructure-deployment",
      heading:      "The Infrastructure Deployment",
      support_text: "Our expert team handles the entire installation with zero disruption to your business, leaving you with a high-performance power system that's fully tested and ready to save you money.",
    },
  ],
  form_settings: {
    form_title:    "Request Quote",
    form_subtitle: "Fill in details",
    fields: [
      { label: "Service Type ?",        type: "select",   placeholder: "Installation service"      },
      { label: "Property Type",         type: "select",   placeholder: "Commercial"                },
      { label: "Business Name",         type: "text",     placeholder: "Enter your business name"  },
      { label: "Phone Number",          type: "tel",      placeholder: "+234"                      },
      { label: "Business Email",        type: "email",    placeholder: "Enter Email"               },
      { label: "Business Description",  type: "textarea", placeholder: "What is your business about ?" },
      { label: "State",                 type: "select",   placeholder: "Lagos"                     },
      { label: "LGA",                   type: "select",   placeholder: "Alimosho"                  },
    ],
    submit_button_text: "Submit",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Rows
// ─────────────────────────────────────────────────────────────────────────────

const SERVICES_SECTIONS_ROWS = [
  {
    id:            "sec-services-hero",
    page_id:       "page-services",
    section_type:  "hero",
    display_order: 10,
    is_visible:    true,
    content:       json(SERVICES_HERO_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-services-main",
    page_id:       "page-services",
    section_type:  "main",
    display_order: 20,
    is_visible:    true,
    content:       json(SERVICES_MAIN_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
  {
    id:            "sec-work-with-us",
    page_id:       "page-services",
    section_type:  "contact_process",
    display_order: 30,
    is_visible:    true,
    content:       json(WORK_WITH_US_CONTENT),
    created_at:    now,
    updated_at:    now,
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("page_sections", SERVICES_SECTIONS_ROWS);
  },

  async down(queryInterface) {
    const ids = SERVICES_SECTIONS_ROWS.map((r) => r.id);
    await queryInterface.bulkDelete("page_sections", { id: ids }, {});
  },
};
