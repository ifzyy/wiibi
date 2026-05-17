import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { usePage, useFaqs } from "../hooks/queries";

// ── Skeleton primitives ────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const ContactSkeleton = () => (
  <main className="bg-white min-h-screen">
    {/* Breadcrumb */}
    <nav className="max-w-7xl mx-auto px-6 pt-12">
      <Skeleton className="h-3 w-32" />
    </nav>

    {/* Header */}
    <header className="max-w-7xl mx-auto px-6 mt-8 mb-16 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-64" />
    </header>

    {/* Main content */}
    <section className="max-w-7xl mx-auto px-6 pb-24">
      <Skeleton className="h-12 w-96 mb-16" />

      <div className="grid lg:grid-cols-12 gap-16">
        {/* Connect column */}
        <div className="lg:col-span-3 space-y-10">
          <Skeleton className="h-8 w-44" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>

        {/* Map column */}
        <div className="lg:col-span-9 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="w-full aspect-[21/9] rounded-[2rem]" />
        </div>
      </div>
    </section>

    <div className="border-[1px] border-[#D9D9D9] p-8 my-20" />

    {/* FAQ section */}
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="grid lg:grid-cols-2 gap-20">
        <div className="space-y-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-14 w-64" />
        </div>
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-6 border-b border-stone-100 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </section>
  </main>
);

// ── Page component ─────────────────────────────────────────────────────────────
const ContactPage = () => {
  const { data: pageData, isLoading: pageLoading, isError: pageError } = usePage("contact");
  const { data: faqs = [], isLoading: faqsLoading } = useFaqs();

  const isLoading = pageLoading || faqsLoading;

  if (isLoading) return <ContactSkeleton />;

  if (pageError || !pageData) {
    return <div className="p-20 text-center font-bold">Page not found.</div>;
  }

  const mainSection = pageData?.sections?.find((s) => s.type === "main") || {};
  const { header, visit_info, connect_info } = mainSection?.content || {};

  return (
    <main className="bg-white min-h-screen">
      {/* 1. BREADCRUMBS & TOP HEADER */}
      <nav className="max-w-7xl mx-auto px-6 pt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
        <a href="/" className="hover:text-stone-900 transition-colors">Home</a>
        <ChevronRight size={10} strokeWidth={3} />
        <span className="text-[#FFAA14]">Contact Us</span>
      </nav>

      <header className="max-w-7xl mx-auto px-6 mt-8 mb-16">
        <p className="text-[#FFAA14] font-bold text-xs uppercase tracking-widest mb-3">
          {header?.sub_heading || "Get in touch"}
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-[#1A1102]">
          {header?.main_heading || "Contact Us"}
        </h1>
      </header>

      {/* 2. MAIN CONTENT SECTION */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-4xl font-black text-[#1A1102] mb-16 tracking-tight max-w-2xl leading-tight">
          Let us know how we can help
        </h2>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Left: Connect Column */}
          <div className="lg:col-span-3">
            <h3 className="text-2xl font-black text-[#1A1102] mb-10">Connect with Us</h3>
            <div className="space-y-10">
              {connect_info?.contact_methods?.map((method, i) => (
                <div key={i}>
                  <p className="text-[#FFAA14] text-[11px] font-black uppercase tracking-widest mb-4">
                    {method.label}
                  </p>
                  <div className="space-y-3">
                    {method.values?.map((val, idx) => (
                      <p key={idx} className="text-stone-900 font-bold text-base">{val}</p>
                    ))}
                  </div>
                </div>
              ))}

              {!connect_info && (
                <div>
                  <p className="text-[#FFAA14] text-[11px] font-black uppercase tracking-widest mb-4">Phone Number</p>
                  <p className="text-stone-900 font-bold text-base">0802 345 567</p>
                  <p className="text-stone-900 font-bold text-base">0802 345 567</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Map & Address Column */}
          <div className="lg:col-span-9">
            <h3 className="text-2xl font-black text-[#1A1102] mb-4">Visit Us</h3>
            <p className="text-stone-500 text-base font-medium mb-8">
              {visit_info?.address || "1, Olaoluwa Street Off Adebowale Road, Ojodu"}
            </p>
            <div className="relative group">
              <div className="w-full aspect-[21/9] rounded-[2rem] overflow-hidden bg-stone-100 border border-stone-100 shadow-sm">
                <iframe
                  title="Wiibi Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.0253578794827!2d3.359265775850983!3d6.643760921742416!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b93943398935b%3A0x6b772c67c519d14a!2sOjodu%20Berger!5e0!3m2!1sen!2sng!4v1710000000000!5m2!1sen!2sng"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: "grayscale(0.2) contrast(1.1)" }}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-[1px] border-[#D9D9D9] p-8 my-20" />

      {/* 3. FAQ SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <span className="text-[#FFAA14] font-bold text-[11px] uppercase tracking-[0.3em] block mb-4">
              Frequently asked questions
            </span>
            <h2 className="text-5xl font-black text-[#1A1102] tracking-tighter leading-tight">
              Questions we have <br /> been asked
            </h2>
          </div>

          <div className="divide-y divide-stone-100">
            {faqs.map((faq) => (
              <details key={faq.id} className="group py-8">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <p className="text-xl font-bold text-stone-900 group-hover:text-[#FFAA14] transition-colors pr-8">
                    {faq.question}
                  </p>
                  <span className="text-3xl font-light text-stone-300 group-open:rotate-45 transition-transform duration-300">
                    +
                  </span>
                </summary>
                <div className="pt-6 text-stone-500 text-lg leading-relaxed max-w-xl">
                  {faq.answer}
                </div>
              </details>
            ))}

            {/* Pagination Controls */}
            <div className="pt-12 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFAA14]" />
                <div className="w-2 h-2 rounded-full bg-stone-200" />
                <div className="w-2 h-2 rounded-full bg-stone-200" />
              </div>
              <div className="flex gap-3">
                <button className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-[#FFAA14] hover:text-[#FFAA14] transition-all">
                  <ChevronLeft size={20} />
                </button>
                <button className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-[#FFAA14] hover:text-[#FFAA14] transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;