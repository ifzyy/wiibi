import React from "react";
import PromoCelebration from "./assets/promo-celebration.svg";
const PromoHeader = () => {
  return (
    <div className="bg-[#1A1102] text-white  text-center p-4 ">
      <a
        href="/promo"
        className=" text-manrope font-semibold flex items-center justify-center hover:underline"
      >
        <img src={PromoCelebration} className="mr-4"/>
        New year Promo is ongoing Check it out
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          className="text-[#FFAA14] text-lucide lucide-chevron-right-icon lucide-chevron-right"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </a>
    </div>
  );
};

export default PromoHeader;
