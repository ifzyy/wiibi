import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChevronRight, ChevronLeft, Maximize2 } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const ContactPage = () => {
  const [pageData, setPageData] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, faqRes] = await Promise.all([
          axios.get(`${API_BASE}/public/pages/contact`),
          axios.get(`${API_BASE}/public/faqs`)
        ]);
        setPageData(pageRes.data);
        setFaqs(faqRes.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-stone-300">LOADING CONTACT...</div>;

  const mainSection = pageData?.sections?.find(s => s.type === "main") || {};
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
                      <p key={idx} className="text-stone-900 font-bold text-base">
                        {val}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Fallback if data is empty */}
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
              {/* Map Container */}
              <div className="w-full aspect-[21/9] rounded-[2rem] overflow-hidden bg-stone-100 border border-stone-100 shadow-sm relative">
                <iframe
                  title="Wiibi Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.0253578794827!2d3.359265775850983!3d6.643760921742416!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b93943398935b%3A0x6b772c67c519d14a!2sOjodu%20Berger!5e0!3m2!1sen!2sng!4v1710000000000!5m2!1sen!2sng"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                  loading="lazy"
                ></iframe>
                
                {/* Map Control UI from Screenshot */}
                <button className="absolute top-4 left-4 bg-stone-900/80 text-white p-2 rounded-lg backdrop-blur-md hover:bg-stone-900 transition-all">
                  <Maximize2 size={20} />
                </button>
              </div>

              {/* Floating Address Card (Optional - only if you want that specific look) */}
              <div className="absolute -bottom-6 left-10 bg-white p-6 rounded-2xl shadow-xl border border-stone-50 hidden lg:block">
                 <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Our Location</p>
                 <p className="text-sm font-black text-stone-900">Ojodu, Lagos State</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAQ SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-32 border-t border-stone-100">
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