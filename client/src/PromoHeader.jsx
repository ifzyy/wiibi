/**
 * PromoHeader — site-wide announcement bar (top of every page via Nav).
 *
 * Content/colors/link come from the `promo_banner` global setting, editable in
 * the admin Promotions section. Renders nothing when disabled or unset, so the
 * bar simply disappears when there's no active promo.
 *
 * Shape of the setting:
 *   { enabled, text, linkUrl, linkLabel, bgColor, textColor, accentColor }
 */
import { useEffect, useState } from "react";
import PromoCelebration from "./assets/promo-celebration.svg";
import { api } from "./utils/api";

const PromoHeader = () => {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get("/public/settings")
      .then((r) => { if (alive) setBanner(r.data?.promo_banner ?? null); })
      .catch(() => { /* no banner on failure */ });
    return () => { alive = false; };
  }, []);

  if (!banner || banner.enabled === false || !banner.text) return null;

  const bg     = banner.bgColor     || "#1A1102";
  const fg     = banner.textColor   || "#FFFFFF";
  const accent = banner.accentColor || "#FFAA14";
  const href   = banner.linkUrl     || "/store";

  return (
    <div className="text-center p-4" style={{ background: bg, color: fg }}>
      <a
        href={href}
        className="text-manrope font-semibold flex items-center justify-center hover:underline"
        style={{ color: fg }}
      >
        <img src={PromoCelebration} className="mr-4" alt="" />
        {banner.text}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke={accent} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="ml-1"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </a>
    </div>
  );
};

export default PromoHeader;
