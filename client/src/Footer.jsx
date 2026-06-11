/**
 * Footer — driven by the admin Settings page (global settings).
 *
 * Resolution order for each value:
 *   1. flat keys edited in Admin → Settings (site_name, contact_email, …)
 *   2. legacy structured rows (footer.contact_info / footer.social_links)
 *   3. hardcoded defaults — so the footer never renders empty
 */
import React from "react";
import WiibiLogo from "./assets/wiibi-logo.svg";
import { FaTiktok, FaInstagram, FaWhatsapp, FaFacebook } from "react-icons/fa";
import usePublicSettings from "./hooks/usePublicSettings.js";
import { useCalculatorModal } from "./context/CalculatorModalContext.jsx";

const footerLinks = [
  {
    title: "Products",
    links: [
      { label: "Services", href: "/services" },
      { label: "Projects", href: "/projects" },
      { label: "Store",    href: "/store"    },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about"   },
      { label: "Contact",  href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Solar Calculator", href: "/calculator", calculator: true },
      { label: "Blog",             href: "/blog"       },
      { label: "Support",          href: "/support"    },
    ],
  },
];

const waLink = (number) => {
  const digits = String(number || "").replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
};

const Footer = () => {
  const s = usePublicSettings();
  const { openCalculator } = useCalculatorModal();

  const legacyContact = s["footer.contact_info"] ?? {};
  const legacySocials = s["footer.social_links"] ?? {};

  const siteName = s.site_name      || "Wiibi Energy";
  const address  = s.address        || legacyContact.address || "1, Olaoluwa Street, Off Adebowale Road, Ojodu";
  const email    = s.contact_email  || legacyContact.email   || "info@wiibienergy.com";
  const phone    = s.contact_phone  || legacyContact.phone   || null;
  const about    = s.footer_about   || null;

  const socials = [
    { Icon: FaTiktok,    href: s.social_tiktok    || legacySocials.tiktok    },
    { Icon: FaInstagram, href: s.social_instagram || legacySocials.instagram },
    { Icon: FaFacebook,  href: s.social_facebook                              },
    { Icon: FaWhatsapp,  href: waLink(s.whatsapp_number) || legacySocials.whatsapp },
  ].filter((x) => x.href);

  const whatsappHref = waLink(s.whatsapp_number) || legacySocials.whatsapp;

  return (
    <footer className="bg-white w-full border-t border-gray-100">
      <div className="container mx-auto flex flex-col lg:flex-row">
        {/* Left Branding & Socials Side */}
        <div className="lg:w-1.8/5 p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex items-center gap-2 mb-8">
            <img src={WiibiLogo} alt={`${siteName} Logo`} className="w-6 h-6" />
            <span className="font-bold text-gray">{siteName}</span>
          </div>

          {about && (
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">{about}</p>
          )}

          <p className="text-gray-600 text-sm leading-relaxed mb-10 max-w-xs whitespace-pre-line">
            {address}
          </p>

          {socials.length > 0 && (
            <div>
              <h4 className="font-bold text-gray mb-6">Socials</h4>
              <div className="flex gap-5">
                {socials.map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFAA14] text-2xl hover:scale-110 transition-transform"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Links Grid */}
        <div className="lg:w-3.2/5 grid grid-cols-2 md:grid-cols-4">
          {footerLinks.map((section, idx) => (
            <div
              key={idx}
              className="p-8 lg:p-16 border-r border-gray-200 last:border-r-0"
            >
              <h4 className="font-bold text-gray mb-8">{section.title}</h4>
              <ul className="space-y-6">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={link.calculator ? (e) => { e.preventDefault(); openCalculator(); } : undefined}
                      className="text-gray-500 hover:text-[#FFAA14] transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Us Column */}
          <div className="p-8 lg:p-16">
            <h4 className="font-bold text-gray mb-8">Contact Us</h4>
            <ul className="space-y-6">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="text-gray-500 hover:text-[#FFAA14] transition-colors text-sm font-medium break-all"
                >
                  {email}
                </a>
              </li>
              {phone && (
                <li>
                  <a
                    href={`tel:${String(phone).replace(/\s/g, "")}`}
                    className="text-gray-500 hover:text-[#FFAA14] transition-colors text-sm font-medium"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {whatsappHref && (
                <li>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-[#FFAA14] transition-colors text-sm font-medium"
                  >
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="text-[#606060] text-center p-4 bg-[#F9F9F9]">
        © {new Date().getFullYear()} {siteName}. All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
