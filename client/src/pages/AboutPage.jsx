import React from "react";
import { Leaf, ChevronRight, Building2, ClipboardList, FileSearch, Zap } from "lucide-react";
import { usePage } from "../hooks/queries";
import { QuoteRequestForm } from "./ServicesPage";

const PROCESS_ICONS = {
  1: <Building2 className="w-5 h-5 text-[#FFAA14]" />,
  2: <ClipboardList className="w-5 h-5 text-[#FFAA14]" />,
  3: <FileSearch className="w-5 h-5 text-[#FFAA14]" />,
  4: <Zap className="w-5 h-5 text-[#FFAA14]" />,
};

// ── Skeleton primitives ────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const AboutSkeleton = () => (
  <main className="bg-white font-sans">
    {/* Breadcrumb + header */}
    <header className="max-w-7xl mx-auto px-8 pt-16 pb-8 space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-40" />
    </header>

    <div className="border-[1px] border-[#D9D9D9] p-8 mb-20" />

    {/* Hero */}
    <section className="max-w-7xl mx-auto px-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-28 w-96 rounded-lg" />
      </div>
      <Skeleton className="w-full aspect-[21/9] rounded-[2.5rem]" />
    </section>

    {/* Pillars */}
    <section className="py-24 space-y-24">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 items-start">
          <div className="space-y-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="w-full aspect-[4/3] rounded-[2rem]" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-[2fr_1fr] gap-8">
            <Skeleton className="w-full min-h-[360px] rounded-[2rem]" />
            <div className="flex flex-col justify-center pl-4 space-y-4">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <div className="border-[1px] border-[#D9D9D9] p-8" />

    {/* Staff grid */}
    <section className="max-w-7xl mx-auto px-8 py-24">
      <div className="flex justify-between items-center mb-20">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="space-y-2 max-w-sm w-full">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-x-8 gap-y-12">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="w-full aspect-[3/4] rounded-3xl" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </section>

    <div className="border-[1px] border-[#D9D9D9] p-8" />
  </main>
);

// ── Page component ─────────────────────────────────────────────────────────────
const AboutPage = () => {
  const { data: pageData, isLoading, isError } = usePage("about");
console.log("AboutPage data:", pageData);
  if (isLoading) return <AboutSkeleton />;

  if (isError || !pageData) {
    return <div className="p-20 text-center font-bold">Page not found.</div>;
  }

  const section = pageData.sections.find((s) => s.type === "about_hero");
  const { brand_info, hero_section, pillars, staff_grid, staff_header } = section.content;
// Resolve images from media array by role — not from content strings
const getMediaUrl = (role) =>
  section.media?.find((m) => m.role === role)?.url ?? null;

const heroImageUrl   = getMediaUrl("hero");
const pillar1Image   = getMediaUrl("pillar1-image");   // whatever role you assigned
const pillar2Image   = getMediaUrl("pillar2-image");
const staffImages = staff_grid.map((_, i) => getMediaUrl(`staff-media-${i+1}`)); // e.g. "staff-media-1", "staff-media-2", etc.
console.log("Resolved media URLs:", { heroImageUrl, pillar1Image, pillar2Image, staffImages });

  return (
    <main className="bg-white selection:bg-amber-100 font-sans">
      {/* 1. BREADCRUMB HEADER */}
      <header className="max-w-7xl mx-auto px-8 pt-16 pb-8">
        <nav className="flex items-center gap-2 text-[10px] font-normal uppercase tracking-widest text-[#ffaa14] mb-8">
          <a href="/" className="text-black">Home</a>
          <ChevronRight size={10} strokeWidth={4} />
          <span className="text-[#ffaa14]">{brand_info.main_heading}</span>
        </nav>
        <p className="text-[#ffaa14] text-[14px]">{brand_info.sub_heading}</p>
        <h2 className="text-black text-[20px] font-bold">{brand_info.main_heading}</h2>
      </header>

      <div className="border-[1px] border-[#D9D9D9] p-8 mb-20" />

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div className="mb-4 md:mb-0">
            <h2 className="text-[#FDB927] text-4xl font-medium tracking-tighter leading-none mb-2">
              {brand_info.brand_name}
            </h2>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-[0.3em]">
              {brand_info.location}
            </p>
          </div>
          <h2 className="text-6xl md:text-[7rem] font-semibold text-[#333] tracking-tighter leading-[0.85] text-right">
            {hero_section.display_title.split(" ").map((word, index, arr) => (
              <span key={index} className={index === arr.length - 1 ? "text-[#1a1102]" : "text-stone-200"}>
                {word}{" "}
              </span>
            ))}
          </h2>
        </div>

        <div className="w-full aspect-[21/9] bg-stone-50 rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-sm">
          {heroImageUrl && (
            <img src={heroImageUrl} className="w-full h-full object-cover" alt="Hero" />
          )}
        </div>
      </section>

      {/* 3. VALUE PILLARS */}
      <section className="py-24 space-y-0">
        {/* Pillar 1 */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-8 items-start">
            <div className="pt-2">
              <h3 className="text-4xl font-medium text-black tracking-tight mb-3">
                {pillars[0].main_heading}
              </h3>
              {pillars[0].sub_headings && (
                <div className="flex flex-col font-medium leading-tight">
                  {pillars[0].sub_headings.map((sh, i) => (
                    <span key={i} className="text-4xl font-medium text-stone-200 cursor-default">{sh}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full aspect-[4/3] bg-stone-50 rounded-[2rem] overflow-hidden border border-stone-100">
              {pillar1Image && (
                <img src={pillar1Image} className="w-full h-full object-cover" alt={pillars[0].main_heading} />
              )}
            </div>
            <div className="pt-2">
              <p className="text-stone-500 text-base leading-relaxed">{pillars[0].support_text}</p>
            </div>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="mt-24" style={{ backgroundColor: pillars[1].bg_color || "#f5f7ee" }}>
          <div className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid grid-cols-[2fr_1fr] gap-8 items-stretch">
              <div className="w-full min-h-[360px] bg-stone-100 rounded-[2rem] overflow-hidden border border-stone-200">
                {pillar2Image && (
                  <img src={pillar2Image} className="w-full h-full object-cover" alt={pillars[1].main_heading} />
                )}
              </div>
              <div className="flex flex-col justify-center pl-4">
                {pillars[1].icon === "leaf-icon" && <Leaf className="text-emerald-700 mb-4" size={28} />}
                <h3 className="text-4xl font-black text-stone-700 tracking-tight mb-4">{pillars[1].main_heading}</h3>
                <p className="text-stone-500 text-base leading-relaxed">{pillars[1].support_text}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 5. LEADERSHIP / STAFF GRID */}
      <section className="max-w-7xl mx-auto px-8 py-24">
        <div className="flex justify-between items-center mb-20">
          <div>
            <h3 className="text-3xl font-bold text-black tracking-tight mb-1">{staff_header.main_heading}</h3>
            {staff_header.sub_headings?.map((heading, i) => (
              <p key={i} className="text-3xl font-bold text-stone-300 leading-snug">{heading}</p>
            ))}
          </div>
          <div className="flex items-start justify-start pt-1">
            <p className="text-stone-500 text-base leading-relaxed max-w-sm">{staff_header.support_text}</p>
          </div>
        </div>

      </section>

  

      {/* 4. CONTACT PROCESS */}
      <section className="py-24">
        <div className="border border-[#D9D9D9] w-full">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <p className="text-[#FFAA14] font-medium">Get Started</p>
            <h3 className="text-3xl font-black text-black mb-2">Our Process</h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 max-w-7xl mx-auto px-6 py-8">
          {/* LEFT: PROCESS STEPS */}
          <div>
            {[
              {
                step_number: 1,
                heading: "Site Assessment",
                support_text: "Our team visits your location to understand your energy needs and evaluate site conditions."
              },
              {
                step_number: 2,
                heading: "Custom Design",
                support_text: "We create a tailored solar solution designed specifically for your requirements."
              },
              {
                step_number: 3,
                heading: "Proposal & Review",
                support_text: "Present detailed proposal including costs, savings, and implementation timeline."
              },
              {
                step_number: 4,
                heading: "Installation & Support",
                support_text: "Professional installation followed by comprehensive maintenance and support."
              }
            ].map((step, idx, arr) => (
              <div key={idx} className="flex gap-5 group">
                {/* Badge + connector column */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#FFAA14] font-black text-sm group-hover:bg-[#FFAA14] group-hover:text-white transition-colors duration-300">
                    {step.step_number}
                  </div>
                  {idx !== arr.length - 1 && (
                    <div className="w-px flex-1 bg-amber-100 mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-10">
                  <h4 className="text-[15px] font-black text-[#1A1102] mb-2 pt-2">
                    {step.heading}
                  </h4>
                  <p className="text-stone-500 text-sm leading-relaxed max-w-sm">
                    {step.support_text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: FORM */}
          <div className="bg-white min-h-[500px] flex flex-col justify-center">
            <QuoteRequestForm formSettings={{
              fields: [
                { label: "Business Name", type: "text", placeholder: "Enter your name" },
                { label: "Business Email", type: "email", placeholder: "Enter your email" },
                { label: "Phone Number", type: "tel", placeholder: "" },
                { label: "Property Type", type: "select", placeholder: "Select type" },
                { label: "State", type: "select", placeholder: "Select state" },
                { label: "LGA", type: "select", placeholder: "Select LGA" },
                { label: "Business Description", type: "textarea", placeholder: "Tell us about yourself" },
              ],
              submit_button_text: "Get Started"
            }} />
          </div>
        </div>
      </section>
      <div className="border-[1px] border-[#D9D9D9] p-8" />
    </main>
  );
};

export default AboutPage;