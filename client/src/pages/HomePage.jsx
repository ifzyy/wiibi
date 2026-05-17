import heroFlower from "../assets/hero-flower.svg";
import { useHomepage,useBlogPosts,useFaqs } from "../hooks/queries";
import StoreCarousel from "../components/StoreCarousel";
import TestimonialCarousel from "../components/TestimonialCarousel";
import { ChevronRight, ChevronLeft } from "lucide-react";
// ── Skeleton primitives ────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const HomeSkeleton = () => (
  <div className="min-h-screen pt-8">
    {/* Hero skeleton */}
    <section className="bg-white">
      <div className="min-h-[85vh] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Left */}
          <div className="flex-[0.9] lg:pr-12 space-y-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-1/2" />
            <Skeleton className="h-6 w-full max-w-xl" />
            <Skeleton className="h-6 w-5/6 max-w-xl" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-12 w-44 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-24" />
          </div>
          {/* Right image */}
          <div className="flex-[1.1] w-full aspect-[4/3]">
            <Skeleton className="w-full h-[420px] rounded-sm" />
          </div>
        </div>
      </div>

      {/* Calculator bar */}
      <div className="w-full border-t border-b border-gray-100 flex flex-col md:flex-row">
        <div className="flex-1 p-8 lg:p-12 border-b md:border-b-0 md:border-r border-gray-100 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 p-8 lg:p-12 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-40" />
        </div>
        <div className="w-full md:w-[120px] bg-gray-200 h-20 md:h-auto" />
      </div>
    </section>

    <div className="border-[1px] border-[#D9D9D9] p-8" />

    {/* Store preview skeleton */}
    <div className="p-8 lg:p-16 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-64" />
      <div className="flex gap-6 mt-6 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72 space-y-3">
            <Skeleton className="h-48 w-full rounded-sm" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>

    <div className="border-[1px] border-[#D9D9D9] p-8" />

    {/* Stats skeleton */}
    <section className="bg-white border-t border-gray-100">
      <div className="container mx-auto flex flex-col lg:flex-row">
        <div className="lg:w-1/3 p-8 lg:p-16 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-32 mt-4" />
        </div>
        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-10 lg:p-14 border-b border-gray-200 space-y-3">
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full max-w-sm" />
              <Skeleton className="h-4 w-4/5 max-w-sm" />
            </div>
          ))}
        </div>
      </div>
    </section>

    <div className="border-[1px] border-[#D9D9D9] p-8" />

    {/* Blog skeleton */}
    <section className="bg-white my-12">
      <div className="container mx-auto flex flex-col lg:flex-row min-h-[600px]">
        <div className="lg:w-1/3 p-8 lg:p-16 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-full min-h-[400px] rounded-none" />
          ))}
        </div>
      </div>
    </section>
  </div>
);
import { useState } from "react";
// ── Page component ─────────────────────────────────────────────────────────────
function HomePage() {
  const { data, isLoading, isError, error } = useHomepage();
    const { data: faqs = [], isLoading: faqsLoading } = useFaqs();
    const [activeCategory, setActiveCategory] = useState("All");
  
  
    const {
      data: postsData,
      isLoading: postsLoading,
    } = useBlogPosts(
      activeCategory !== "All" ? { category: activeCategory, limit: 100 } : { limit: 100 }
    );
    console.log(postsData)
  
console.log(data)
  if (isLoading) return <HomeSkeleton />;

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-gray-600">
            {error?.response?.data?.message || "The requested page could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  // Support both { sections, page } shape and flat data shape
  const sections = data.sections ?? [];
  if (data.page?.meta_title || data.page?.title) {
    document.title = data.page.meta_title || data.page.title;
  }

  const getSection = (type) => sections.find((s) => s.type === type) || {};

  const hero         = getSection("hero");
  const storePreview = getSection("store-preview");
  const stats        = getSection("stats");
  const blogTeaser   = getSection("blog-teaser");
  const testimonials = getSection("testimonials");
  const faqTeaser    = getSection("faq-teaser");
  const cta          = getSection("cta");

  const heroImg =
    hero.media?.find((m) => m.role === "hero")?.url ||
    hero.media?.[0]?.url ||
    "/placeholder-hero.jpg";

  const ctaImage =
    cta.media?.find((m) => m.role === "cta")?.url || cta.media?.[0]?.url;

  return (
    <div className="min-h-screen pt-8">
      {/* ── Hero ── */}
      {hero.content && (
        <section className="bg-white">
          <div className="min-h-[85vh] flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center gap-12">
              {/* Left Content */}
              <div className="flex-[0.9] lg:pr-12">
                <p className="text-[#FFAA14] font-semibold uppercase tracking-wider text-sm mb-6">
                  {hero.content.subtitle}
                </p>
                <h1 className="text-[#1A1102] text-5xl xl:text-7xl font-bold leading-tight mb-8">
                  {hero.content.title}
                </h1>
                <p className="text-[#606060] text-lg xl:text-xl font-medium max-w-xl mb-10 leading-relaxed">
                  {hero.content.main_support_text}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <button className="bg-[#1A1102] px-8 py-4 text-white font-bold rounded-md hover:bg-black transition-colors">
                    View our packages
                  </button>
                </div>
                <img src={heroFlower} className="w-8 h-8" alt="" />
                <p className="font-light text-[#606060] text-[17px] max-w-[260px]">
                  {hero.content.second_support_text}
                </p>
                <a className="inline-flex items-center gap-2 mt-4 border-b-2 border-[#606060] pb-1 text-[#606060]">
                  learn more
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                  </svg>
                </a>
              </div>

              {/* Right Image */}
              <div className="flex-[1.1] w-full aspect-[4/3] rounded-sm overflow-hidden">
                <img src={heroImg} className="w-full h-auto object-cover" alt="Solar installation" />
              </div>
            </div>
          </div>

          {/* Calculator Bar */}
          <div className="w-full border-t border-b border-gray-100 flex flex-col md:flex-row">
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-bold uppercase tracking-tighter">
                  {hero.content.question_text}
                </h3>
                <div className="flex gap-1 text-[#FFAA14]">
                  <span className="font-bold">›</span>
                  <span className="font-bold">›</span>
                  <span className="font-bold opacity-50">›</span>
                </div>
              </div>
              <p className="text-gray-500 font-medium">{hero.content.confidence_text}</p>
            </div>

            <div className="flex-1 p-8 lg:p-12 flex items-center justify-between bg-white">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray mb-2">Solar Calculator</span>
                <h4 className="text-4xl lg:text-5xl font-bold">₦125,000</h4>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-[#FFAA14] p-2 hover:bg-gray-50 rounded-full transition">‹</button>
                <span className="bg-gray-50 px-4 py-2 rounded-md text-sm font-bold">Monthly</span>
                <button className="text-[#FFAA14] p-2 hover:bg-gray-50 rounded-full transition">›</button>
              </div>
            </div>

            <div className="w-full md:w-[120px] bg-[#FFAA14] flex items-center justify-center cursor-pointer hover:bg-yellow-500 transition-colors">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </section>
      )}

      <div className="border-[1px] border-[#D9D9D9] p-8" />

      {/* ── Store Preview ── */}
      {storePreview.content && <StoreCarousel storePreview={storePreview} />}

      <div className="border-[1px] border-[#D9D9D9] p-8" />

      {/* ── Stats ── */}
      {stats.content && (
        <section className="bg-white border-t border-gray-100">
          <div className="container mx-auto flex flex-col lg:flex-row">
            <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
              <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4">
                {stats.content.title}
              </span>
              <h2 className="text-4xl font-bold text-gray mb-6">{stats.content.heading}</h2>
              <p className="text-gray-600 leading-relaxed mb-8">{stats.content.paragraph_text}</p>
              <div>
                <a href={stats.content.button_link} className="inline-flex items-center gap-2 text-gray-700 font-medium border-b-2 border-gray-300 pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-all">
                  {stats.content.button_text}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
                </a>
              </div>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
              {stats.content.stats?.map((stat, i) => (
                <div key={i} className={`p-10 lg:p-14 border-b border-gray-200 transition-colors hover:bg-gray-50 ${i % 2 === 0 ? "md:border-r" : ""} ${i >= stats.content.stats.length - 2 ? "md:border-b-0" : ""}`}>
                  <div className="flex items-baseline gap-1 mb-2">
                    <h4 className={`text-5xl font-bold ${i === 0 ? "text-[#FFAA14]" : "text-gray-800"}`}>
                      {stat.value.replace(/[^0-9.]/g, "")}
                    </h4>
                    <span className={`text-2xl font-semibold ${i === 0 ? "text-[#FFAA14]" : "text-gray-500"}`}>
                      {stat.value.replace(/[0-9.]/g, "")}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray mb-4 capitalize">{stat.label}</p>
                  <p className="text-gray-600 leading-snug max-w-sm">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="border-[1px] border-[#D9D9D9] p-8" />

      {/* ── Blog Teaser ── */}
      {blogTeaser.content && (
        <section className="bg-white my-12">
          <div className="container mx-auto flex flex-col lg:flex-row min-h-[600px]">
            <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
              <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-2">
                {blogTeaser.content.title}
              </span>
              <h2 className="text-4xl font-bold text-gray mb-6">{blogTeaser.content.heading}</h2>
              <p className="text-gray-600 leading-relaxed mb-8">{blogTeaser.content.sub_heading}</p>
              <div>
                <a href={blogTeaser.content.button_link} className="inline-flex items-center gap-2 text-gray-700 font-medium border-b-2 border-gray-300 pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-all">
                  {blogTeaser.content.button_text}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17l10-10M7 7h10v10" /></svg>
                </a>
              </div>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
              {postsData?.blogs && postsData.blogs.length > 0 ? (
                postsData.blogs.slice(0, 2).map((post, i) => (
                  <div key={i} className="relative group overflow-hidden border-r border-gray-200 last:border-r-0 aspect-[1/2] md:aspect-auto">
                    <img
                      src={post.featuredImage || "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800"}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-150" />
                    <div className="absolute top-8 left-8">
                      <span className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider">
                        {i === 0 ? "News" : "Payment"}
                      </span>
                    </div>
                    <div className="absolute bottom-12 left-10 right-10 text-white">
                      <h3 className="text-2xl font-bold mb-3 leading-tight">{post.title}</h3>
                      <p className="text-gray-300 text-sm mb-6 line-clamp-2 font-light">{post.excerpt}</p>
                      <a href={post.link} className="inline-flex items-center gap-2 text-white text-sm font-semibold border-b border-white pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-colors">
                        Learn More
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17l10-10M7 7h10v10" /></svg>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 flex items-center justify-center min-h-[400px] bg-gradient-to-br from-stone-50 to-gray-50 rounded-md border border-gray-200">
                  <div className="text-center px-8 py-16 max-w-md">
    
                    <p className="text-gray-600 font-medium mb-6 leading-relaxed">
               No article added yet
                    </p>
             
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="border-[1px] border-[#D9D9D9] p-8" />

      {/* ── Testimonials ── */}
      {testimonials.content && <TestimonialCarousel testimonials={testimonials} />}

      <div className="border-[1px] border-[#D9D9D9] p-8" />

   {/* ── FAQ Teaser ── */}
{faqTeaser.content && (
  <section className="bg-white border-t border-gray-100 overflow-hidden">
    <div className="container mx-auto flex flex-col lg:flex-row">
      
      {/* Left Column: Branding & CTA */}
      <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
        <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4">
          {faqTeaser.content.title}
        </span>
        <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {faqTeaser.content.heading}
        </h2>
        <p className="text-gray-500 mb-8 font-medium">
          {faqTeaser.content.sub_heading}
        </p>
        
        <div className="flex flex-wrap items-center gap-6 mt-auto">
          <button className="bg-white border border-gray-200 text-gray-900 px-5 py-2.5 rounded-md font-semibold text-sm shadow-sm hover:bg-gray-50 transition">
            Request a quote
          </button>
          <a href="/contact" className="inline-flex items-center gap-2 text-gray-500 font-medium border-b border-gray-300 pb-0.5 hover:text-black hover:border-black transition-all text-sm">
            Contact Us
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17l10-10M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>

      {/* Right Column: Accordion List */}
      <div className="lg:w-2/3 p-8 lg:p-16 flex flex-col justify-between">
        <div className="divide-y divide-stone-100">
          {faqs.map((faq) => (
            <details key={faq.id} className="group py-8 first:pt-0">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <p className="text-xl font-bold text-stone-900 group-hover:text-[#FFAA14] transition-colors pr-8">
                  {faq.question}
                </p>
                <span className="text-3xl font-light text-stone-300 group-open:rotate-45 group-open:text-[#FFAA14] transition-all duration-300 select-none">
                  +
                </span>
              </summary>
              <div className="pt-6 text-stone-500 text-lg leading-relaxed max-w-2xl">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="pt-12 flex items-center justify-between mt-auto">
          {/* Progress Indicators */}
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFAA14]" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-3">
            <button className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-[#FFAA14] hover:text-[#FFAA14] transition-all shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <button className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-[#FFAA14] hover:text-[#FFAA14] transition-all shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

    </div>
  </section>
)}

      <div className="border-[1px] border-[#D9D9D9] p-8" />

      {/* ── CTA ── */}
      {cta.content && (
        <section className="bg-white">
          <div className="container mx-auto flex flex-col lg:flex-row min-h-[500px]">
            <div className="lg:w-2/3 flex items-center justify-center p-6 lg:p-0 my-8">
              <div className="relative z-10 w-full max-w-3xl h-[400px] lg:h-[500px]">
                <img
                  src={ctaImage || "https://images.unsplash.com/flagged/photo-1566838616631-f2618f74a6a2?w=600&auto=format&fit=crop&q=60"}
                  alt="Happy Family"
                  className="w-full h-full object-cover rounded-sm shadow-2xl"
                />
              </div>
            </div>
            <div className="lg:w-1/3 p-12 lg:p-20 flex flex-col justify-center border-l border-gray-100 bg-white">
              <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wider mb-8">
                {cta.content.title || "Optimize"}
              </span>
              <div className="mb-10">
                <h2 className="text-4xl md:text-5xl font-medium text-gray-500 mb-2">{cta.content.heading_one}</h2>
                <h2 className="text-4xl md:text-5xl font-bold text-gray">{cta.content.heading_two}</h2>
              </div>
              <div>
                <a href={cta.content.button_link} className="inline-block bg-[#1A1102] text-white px-10 py-4 rounded-md font-bold text-sm hover:bg-black transition-all shadow-lg">
                  {cta.content.button_text}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HomePage;