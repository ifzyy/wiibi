import React from "react";
import WiibiLogo from "./assets/wiibi-logo.svg"; // Adjust path as needed
import { FaTiktok, FaInstagram, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  const footerLinks = [
    {
      title: "Products",
      links: ["Services", "Packages", "Projects", "Store"],
    },
    {
      title: "Company",
      links: ["About Us", "Privacy", "Terms"],
    },
    {
      title: "Resources",
      links: ["Solar Calculator", "FAQ", "Blog"],
    },
  ];

  return (
    <footer className="bg-white  w-full border-t border-gray-100">
      <div className="container mx-auto flex flex-col lg:flex-row">
        {/* Left Branding & Socials Side */}
        <div className="lg:w-1.8/5 p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex items-center gap-2 mb-8">
            <img src={WiibiLogo} alt="Wiibi Logo" className="w-6 h-6" />
            <span className="font-bold text-gray ">Wiibi Energy</span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-10 max-w-xs">
            1, Olaoluwa Street
            <br />
            Off Adebowale Road, Ojodu
          </p>

          <div>
            <h4 className="font-bold text-gray  mb-6">Socials</h4>
            <div className="flex gap-5">
              <a
                href="#"
                className="text-[#FFAA14] text-2xl hover:scale-110 transition-transform"
              >
                <FaTiktok />
              </a>
              <a
                href="#"
                className="text-[#FFAA14] text-2xl hover:scale-110 transition-transform"
              >
                <FaInstagram />
              </a>
              <a
                href="#"
                className="text-[#FFAA14] text-2xl hover:scale-110 transition-transform"
              >
                <FaWhatsapp />
              </a>
            </div>
          </div>
        </div>

        {/* Right Links Grid */}
        <div className="lg:w-3.2/5 grid grid-cols-2 md:grid-cols-4">
          {footerLinks.map((section, idx) => (
            <div
              key={idx}
              className="p-8 lg:p-16 border-r border-gray-200 last:border-r-0"
            >
              <h4 className="font-bold text-gray  mb-8">{section.title}</h4>
              <ul className="space-y-6">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href={`/${link.toLowerCase().replace(" ", "-")}`}
                      className="text-gray-500 hover:text-[#FFAA14] transition-colors text-sm font-medium"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Us Column */}
          <div className="p-8 lg:p-16">
            <h4 className="font-bold text-gray  mb-8">Contact Us</h4>
            <ul className="space-y-6">
              <li>
                <a
                  href="mailto:info@wiibienergy.com"
                  className="text-gray-500 hover:text-[#FFAA14] transition-colors text-sm font-medium"
                >
                  info@wiibienergy.com
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-[#FFAA14] transition-colors text-sm font-medium"
                >
                  Whatsapp
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-[#606060] text-center p-4 bg-[#F9F9F9] ">
        {" "}
        © 2026 Wiibi Technologies. All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
