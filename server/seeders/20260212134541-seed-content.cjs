"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ────────────────────────────────────────────────
    // 1. Media – images used on homepage
    // ────────────────────────────────────────────────
    await queryInterface.bulkInsert("media", [
      {
        id: "media-hero-bg",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600",
        alt_text: "Modern solar-powered home – hero background",
        type: "image",
        filename: "medi-hq",
        mime_type: "image/jpeg",
        size_bytes: 150000,
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
        size_bytes: 150000,
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
        size_bytes: 150000,
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
        size_bytes: 150000,
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
        size_bytes: 150000,
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
        size_bytes: 150000,
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
        size_bytes: 150000,
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
        size_bytes: 150000,
        width: 1200,
        height: 800,
      },
    ]);

    // ────────────────────────────────────────────────
    // 2. Global Settings
    // ────────────────────────────────────────────────
    await queryInterface.bulkInsert("global_settings", [
      // ────────────────────────────────────────────────
      // NAVIGATION SETTINGS
      // ────────────────────────────────────────────────
      {
        id: "gs-nav-links",
        key: "navigation.main_menu",
        value: JSON.stringify([
          { label: "Store", link: "/store", hasDropdown: true },
          { label: "Project", link: "/projects", hasDropdown: true },
          {
            label: "Solar Calculator",
            link: "/calculator",
            hasDropdown: false,
          },
          { label: "Blog", link: "/blog", hasDropdown: false },
          { label: "Contact Us", link: "/contact", hasDropdown: false },
          { label: "About Us", link: "/about", hasDropdown: false },
          { label: "Get a Quote", link: "/get-quote", hasDropdown: false },
        ]),
        type: "text",
        group: "navigation",
        label: "Main Navigation Links",
        description: "Links displayed in the header menu",
        is_public: true,
        is_system: true,
      },

      // ────────────────────────────────────────────────
      // FOOTER SETTINGS
      // ────────────────────────────────────────────────
      {
        id: "gs-footer-structure",
        key: "footer.columns",
        value: JSON.stringify([
          {
            title: "Products",
            links: [
              { label: "Services", url: "/services" },
              { label: "Packages", url: "/packages" },
              { label: "Projects", url: "/projects" },
              { label: "Store", url: "/store" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About Us", url: "/about" },
              { label: "Privacy", url: "/privacy" },
              { label: "Terms", url: "/terms" },
            ],
          },
          {
            title: "Resources",
            links: [
              { label: "Solar Calculator", url: "/calculator" },
              { label: "FAQ", url: "/faq" },
              { label: "Blog", url: "/blog" },
            ],
          },
        ]),
        type: "text",
        group: "footer",
        label: "Footer Columns",
        description: "Multi-column link structure for the footer",
        is_public: true,
        is_system: true,
      },
      {
        id: "gs-footer-socials",
        key: "footer.social_links",
        value: JSON.stringify({
          tiktok: "https://tiktok.com/@wiibienergy",
          instagram: "https://instagram.com/wiibienergy",
          whatsapp: "https://wa.me/2349162102080",
        }),
        type: "text",
        group: "footer",
        label: "Social Media Links",
        description: "URLs for footer social icons",
        is_public: true,
        is_system: true,
      },
      {
        id: "gs-footer-contact",
        key: "footer.contact_info",
        value: JSON.stringify({
          address: "1, Olaoluwa Street, Off Adebowale Road, Ojodu, Lagos",
          email: "info@wiibienergy.com",
          phone: "09162102080",
        }),
        type: "text",
        group: "footer",
        label: "Footer Contact Details",
        description: "Address and email displayed in the footer branding area",
        is_public: true,
        is_system: true,
      },
    ]);
    // ────────────────────────────────────────────────
    // 3. Pages – only homepage for now
    // ────────────────────────────────────────────────
    await queryInterface.bulkInsert("pages", [
      {
        id: "page-home",
        title: "Home",
        slug: "home",
        status: "published",
        meta_title: "Wiibi Energy – Reliable Solar & Backup Power Solutions",
        meta_description:
          "Professional solar installations, inverters, batteries and smart home solutions in Nigeria.",
      },
    ]);

    // ────────────────────────────────────────────────
    // 4. Page Sections – homepage only
    // ────────────────────────────────────────────────
    await queryInterface.bulkInsert("page_sections", [
      // 1. Hero
      {
        id: "sec-home-hero",
        page_id: "page-home",
        section_type: "hero",
        display_order: 10,
        is_visible: true,
        content: JSON.stringify({
          title: "Lower your energy bills with solar",
          subtitle: "Renewable energy for africa",
          main_support_text:
            "Reliable, affordable, and sustainable solar solutions for homes and businesses.",
          main_button_text: "Get a Quote",
          main_button_link: "/get-quote",
          second_support_text:
            "Our work supports the transition to cleaner and more reliable power.",
          button2_text: "learn more",
          button2_link: "tel:09162102080",
          hero_image: "media-hero-01",
          // Added fields for the bottom bar
          question_text: "HOW MUCH DO YOU SPEND ON POWER?",
          confidence_text: "Lets fix your expenses",
          calculator_label: "Solar Calculator",
          initial_amount: "₦125,000",
        }),
      },

      // 2. Online Store Preview
      {
        id: "sec-home-store",
        page_id: "page-home",
        section_type: "store-preview",
        display_order: 20,
        is_visible: true,
        content: JSON.stringify({
          title: "Online Store",
          heading: "Go Solar",
          sub_heading: "Save more energy with our smart product",
          products: [
            {
              name: "Lithium Battery 5kWh",
              description: "Track power usage of any appliance",
              price: "₦850,000",
              image_id: "media-product-3",
              link: "/store/lithium-battery-5kwh",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
            {
              name: "5kVA Hybrid Inverter",
              description: "Track power usage of any appliance",
              price: "₦1,250,000",
              image_id: "media-product-3",
              link: "/store/5kva-hybrid-inverter",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
            {
              name: "Smart CCTV Camera",
              description: "Track power usage of any appliance",
              price: "₦145,000",
              image_id: "media-product-3",
              link: "/store/smart-cctv-camera",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
            {
              name: "Smart CCTV Camera",
              description: "Track power usage of any appliance",
              price: "₦145,000",
              image_id: "media-product-3",
              link: "/store/smart-cctv-camera",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
            {
              name: "Smart CCTV Camera",
              description: "Track power usage of any appliance",
              price: "₦145,000",
              image_id: "media-product-3",
              link: "/store/smart-cctv-camera",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
            {
              name: "Smart CCTV Camera",
              description: "Track power usage of any appliance",
              price: "₦145,000",
              image_id: "media-product-3",
              link: "/store/smart-cctv-camera",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
            {
              name: "Smart CCTV Camera",
              description: "Track power usage of any appliance",
              price: "₦145,000",
              image_id: "media-product-3",
              link: "/store/smart-cctv-camera",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
            {
              name: "Smart CCTV Camera",
              description: "Track power usage of any appliance",
              price: "₦145,000",
              image_id: "media-product-3",
              link: "/store/smart-cctv-camera",
              buy_button_text: "Buy Now",
              but_button_link: "/store/buy-lithium",
            },
          ],
          button_text: "open store",
          button_link: "/store",
        }),
      },

      // 3. Stats
      {
        id: "sec-home-stats",
        page_id: "page-home",
        section_type: "stats",
        display_order: 30,
        is_visible: true,
        content: JSON.stringify({
          title: "Our results speak for us",
          heading: "So far so Good",
          paragraph_text:
            "Our installations continue to perform within expected design parameters across deployed systems. Results to date validate our engineering approach and execution standards.",
          button_text: "See project",
          button_link: "/projects",

          stats: [
            {
              label: "Homes powered",
              value: "127+",
              description:
                "We’ve successfully designed and installed solar systems for households across urban and off-grid communities.",
            },
            {
              label: "Total Installed Capacity",
              value: "127MWp",
              description:
                "Our projects account for multiple megawatts of installed solar capacity across distributed energy systems.",
            },
            {
              label: "Homes upgraded",
              value: "99.8%",
              description:
                "Our projects account for multiple megawatts of installed solar capacity across distributed energy systems.",
            },
            {
              label: "carbon dioxide offset",
              value: "6200+ tons",
              description:
                "By replacing fossil-fuel-based power sources, our installations measurably reduce greenhouse gas emissions",
            },
            {
              label: "average uptime",
              value: "99.9%",
              description:
                "Engineered for reliability, our systems deliver consistent power with minimal downtime.",
            },
            {
              label: "Typical ROI",
              value: "3-5 years",
              description:
                "Most customers recover their investment within three to five years through energy savings",
            },
          ],
        }),
      },

      // 4. Blog Teaser
      {
        id: "sec-home-blog",
        page_id: "page-home",
        section_type: "blog-teaser",
        display_order: 40,
        is_visible: true,
        content: JSON.stringify({
          title: "Our Voice",
          heading: "Our Blog",
          sub_heading:
            "We document system design decisions, performance insights, and lessons from the field. Our blog focuses on practical knowledge drawn from real installations.",
          posts: [
            {
              title: "Lithium vs Tubular Batteries: Which is Best for Nigeria?",
              excerpt:
                "A detailed comparison of battery types for solar systems in our climate.",
              image_id: "media-hero-01",
              link: "/blog/lithium-vs-tubular",
            },
            {
              title: "How to Reduce Your Electricity Bill by 70%",
              excerpt: "Practical tips for energy saving in Nigerian homes.",
              image_id: "media-stats-01",
              link: "/blog/reduce-electricity-bill",
            },
            {
              title: "Smart Home Security on a Budget",
              excerpt: "Affordable CCTV and smart lock setups that work.",
              image_id: "media-product-3",
              link: "/blog/smart-home-security-budget",
            },
          ],
          button_text: "See all Articles",
          button_link: "/blog",
        }),
      },

      // 5. Testimonials
      {
        id: "sec-home-testimonials",
        page_id: "page-home",
        section_type: "testimonials",
        display_order: 50,
        is_visible: true,
        content: JSON.stringify({
          title: "Testimonials",
          heading: "Meet Our Clients",
          sub_heading:
            "We work with homeowners, businesses, and institutions that require reliable power solutions. Each project reflects specific operational needs and constraints.",
          button_text: "Request a Quote",
          button_link: "/quote",
          testimonials: [
            {
              name: "Aisha O.",
              location: "Lagos",
              text: "Wiibi installed a 5kVA system for my duplex. No more generator noise!",
              image_id: "media-testimonial-1",
              button_text: "See full case study",
              button_link: "/full",
            },
            {
              name: "Chinedu M.",
              location: "Abuja",
              text: "The lithium batteries are holding up very well even during rainy season.",
              image_id: "media-testimonial-2",
              button_text: "See full case study",
              button_link: "/full",
            },
            {
              name: "Fatima K.",
              location: "Port Harcourt",
              text: "Professional team, fast installation, and great after-sales support.",
              image_id: "media-testimonial-3",
              button_text: "See full case study",
              button_link: "/full",
            },
          ],
        }),
      },

      // 6. FAQ Teaser
      {
        id: "sec-home-faq",
        page_id: "page-home",
        section_type: "faq-teaser",
        display_order: 60,
        is_visible: true,
        content: JSON.stringify({
          title: "Frequently asked Questions",
          heading: "Questions We've been asked",
          sub_heading: "For clarity and inquiries. reach out to us",
          button_text_one: "request a quote",
          button_text_one_link: "/link",
          button_text_two: "request a quote",
          button_text_two_link: "/link",
          faqs: [
            {
              question: "How long do solar panels last?",
              answer:
                "Most high-quality panels come with 25–30 year performance warranties.",
            },
            {
              question: "Do solar systems work during rainy season?",
              answer:
                "Yes, though production is lower. Batteries and grid/hybrid systems ensure power availability.",
            },
            {
              question: "What is the payback period in Nigeria?",
              answer: "Typically 5–7 years depending on system size and usage.",
            },
            {
              question: "Can I start small and expand later?",
              answer:
                "Yes – our systems are modular and can be expanded easily.",
            },
          ],
        }),
      },

      // 7. CTA (Get a Quote) – with background image
      {
        id: "sec-home-cta",
        page_id: "page-home",
        section_type: "cta",
        display_order: 70,
        is_visible: true,
        content: JSON.stringify({
          title: "optimize",
          heading_one: "Smart Living",
          heading_two: "Happy Living",
          button_text: "request a Quote",
          button_link: "/get-quote",
          background_image_id: "media-cta-bg",
        }),
      },

      // 8. Footer (stored as a special section)
      {
        id: "sec-home-footer",
        page_id: "page-home",
        section_type: "footer",
        display_order: 80,
        is_visible: true,
        content: JSON.stringify({
          phone: "09162102080",
          address: "1, Olaoluwa Street, Off Adebowale Road, Ojodu, Lagos",
          website: "www.wiibienergy.com",
          social: {
            facebook: "https://facebook.com/wiibienergy",
            instagram: "https://instagram.com/wiibienergy",
            twitter: "https://twitter.com/wiibienergy",
          },
          copyright: "© 2025 Wiibi Energy. All rights reserved.",
        }),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("page_sections", null, {});
    await queryInterface.bulkDelete("pages", null, {});
    await queryInterface.bulkDelete("global_settings", null, {});
    await queryInterface.bulkDelete("media", null, {});
  },
};
