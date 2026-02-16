import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Building2, 
  ClipboardList, 
  FileSearch, 
  Zap, 
  ChevronDown, 
  ArrowUpRight 
} from 'lucide-react';

// Hardcoded Icon Map for your process steps
const PROCESS_ICONS = {
  "1": <Building2 className="w-5 h-5 text-stone-600" />,
  "2": <ClipboardList className="w-5 h-5 text-stone-600" />,
  "3": <FileSearch className="w-5 h-5 text-stone-600" />,
  "4": <Zap className="w-5 h-5 text-stone-600" />,
};

const ServicesPage = () => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback images based on your content
  const getFallbackImage = (keyword) => `https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/public/pages/services');
        setPageData(response.data);
      } catch (error) {
        console.error("Error fetching page data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center font-bold">Loading...</div>;
  if (!pageData) return <div className="p-20 text-center font-bold">Page not found.</div>;

  return (
    <main className="bg-white min-h-screen">
      {pageData.sections.sort((a, b) => a.order - b.order).map((section) => {
        switch (section.type) {
          case 'hero':
            return (
              <header key={section.id} className="max-w-7xl mx-auto px-6 pt-24 pb-12 border-b border-stone-100">
                <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mb-3">
                    {section.content.subtitle}
                </p>
                <h1 className="text-4xl md:text-5xl font-black text-stone-900">
                    {section.content.title}
                </h1>
              </header>
            );

          case 'main':
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 py-20 space-y-32">
                {section.content.main_steps.map((step, index) => (
                  <div 
                    key={index} 
                    className={`grid md:grid-cols-2 gap-12 md:gap-24 items-center`}
                  >
                    {/* Image Block - Alternates Order based on index */}
                    <div className={`bg-stone-100 rounded-2xl aspect-[4/3] overflow-hidden ${index % 2 !== 0 ? 'md:order-2' : ''}`}>
                       <img 
                        src={getFallbackImage(step.main_heading)} 
                        alt={step.main_heading} 
                        className="w-full h-full object-cover mix-blend-multiply opacity-80"
                      />
                    </div>

                    {/* Text Block */}
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-stone-900 leading-tight">
                        {step.main_heading}
                      </h3>
                      <p className="text-stone-500 text-lg leading-relaxed max-w-md">
                        {step.support_text}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            );

        case 'contact_process':
            return (
              <section key={section.id} className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid lg:grid-cols-2 gap-20">
                  
                  {/* LEFT: PROCESS STEPS */}
                  <div className="space-y-16">
                    {section.content.process_steps.map((step, idx) => (
                      <div key={idx} className="relative flex gap-8 group">
                        {/* Connecting Line logic */}
                        {idx !== section.content.process_steps.length - 1 && (
                          <div className="absolute left-[26px] top-14 w-[1px] h-full bg-stone-100" />
                        )}
                        
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                            {PROCESS_ICONS[step.step_number] || <Zap size={20} />}
                          </div>
                        </div>

                        <div className="pt-2">
                          <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest block mb-1">
                            {step.step_number}. {step.heading.split(' ')[0]} {/* e.g. "The" */}
                          </span>
                          <h4 className="text-xl font-black text-stone-900 mb-3">{step.heading}</h4>
                          <p className="text-stone-500 text-sm leading-relaxed max-w-sm">
                            {step.support_text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RIGHT: REQUEST QUOTE FORM */}
                  <div className="bg-white">
                    <div className="mb-10">
                      <h3 className="text-3xl font-black text-stone-900 mb-2">
                        {section.content.form_settings.form_title}
                      </h3>
                      <p className="text-stone-400 font-medium">
                        {section.content.form_settings.form_subtitle}
                      </p>
                    </div>

                    <form className="grid grid-cols-2 gap-x-4 gap-y-6">
                      {section.content.form_settings.fields.map((field, i) => {
                        const isFullWidth = field.type === 'textarea' || field.label.includes('Business Name');
                        
                        return (
                          <div key={i} className={`flex flex-col gap-2 ${isFullWidth ? 'col-span-2' : 'col-span-1'}`}>
                            <label className="text-xs font-black text-stone-900 ml-1">
                              {field.label}
                            </label>

                            <div className="relative group">
                              {field.type === 'select' ? (
                                <>
                                  <select className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium text-stone-500 appearance-none outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer">
                                    <option>{field.placeholder}</option>
                                  </select>
                                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                                </>
                              ) : field.type === 'textarea' ? (
                                <textarea 
                                  rows={4} 
                                  className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                                  placeholder={field.placeholder}
                                />
                              ) : (
                                <input 
                                  type={field.type} 
                                  className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                  placeholder={field.placeholder}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <div className="col-span-2 pt-4">
                        <button 
                          type="submit" 
                          className="w-fit bg-[#FDB927] hover:bg-amber-500 text-stone-900 font-black px-10 py-4 rounded-xl shadow-lg shadow-amber-200/50 transition-all active:scale-95 flex items-center gap-2"
                        >
                          {section.content.form_settings.submit_button_text}
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </section>
            );
          default:
            return null;
        }
      })}
    </main>
  );
};

export default ServicesPage;