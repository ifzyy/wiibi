import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import heroFlower from "../assets/hero-flower.svg";
import heroImage from "../assets/cta.png";
import axios from "axios";
import StoreCarousel from "../components/StoreCarousel";
import TestimonialCarousel from "../components/TestimonialCarousel";
function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:5000/api/public/pages/home`,
        );
        setData(response.data);
        document.title =
          response.data.page.meta_title || response.data.page.title;
      } catch (err) {
        console.error("Page fetch error:", err);
        setError(err.response?.data?.message || "Failed to load page content");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-gray-600">
            {error || "The requested page could not be loaded."}
          </p>
        </div>
      </div>
    );
  }
  console.log(data);
  // Find sections by type for easy rendering
  const getSection = (type) => data.sections.find((s) => s.type === type) || {};

  const hero = getSection("hero");
  const storePreview = getSection("store-preview");
  const stats = getSection("stats");
  const blogTeaser = getSection("blog-teaser");
  const testimonials = getSection("testimonials");
  const faqTeaser = getSection("faq-teaser");
  const cta = getSection("cta");
  const footer = getSection("footer");

  return (
    <div className="min-h-screen pt-8">
      {/* Hero Section */}
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
<img src={heroFlower} className="w-8 h-8" />


                <p className="font-light text-[#606060] text-[17px] max-w-[260px]">
                  {hero.content.second_support_text}
                </p>

                <a className="inline-flex items-center gap-2 mt-4 border-b-2 border-[#606060] pb-1 text-[#606060]">
                  learn more
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-arrow-up-right"
                  >
                    <path d="M7 7h10v10" />

                    <path d="M7 17 17 7" />
                  </svg>
                </a>
              </div>

              {/* Right Video/Image */}
              <div className="flex-[1.1] w-full aspect-[4/3] bg-gray-100 rounded-sm overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1583345237708-add35a664d77?w=1600&auto=format&fit=crop&q=80"
                  className="w-full h-full object-cover"
                  alt="Solar installation"
                />
              </div>
            </div>
          </div>

          {/* Bottom Calculator Bar - Matching Screenshot image_a21423.png */}
          <div className="w-full border-t border-b border-gray-100 flex flex-col md:flex-row">
            {/* Left side: Question */}
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
              <p className="text-gray-500 font-medium">
                {hero.content.confidence_text}
              </p>
            </div>

            {/* Center side: Amount Display */}
            <div className="flex-1 p-8 lg:p-12 flex items-center justify-between bg-white relative">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 mb-2">
                  Solar Calculator
                </span>
                <h4 className="text-4xl lg:text-5xl font-bold">₦125,000</h4>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-[#FFAA14] p-2 hover:bg-gray-50 rounded-full transition">
                  ‹
                </button>
                <span className="bg-gray-50 px-4 py-2 rounded-md text-sm font-bold">
                  Monthly
                </span>
                <button className="text-[#FFAA14] p-2 hover:bg-gray-50 rounded-full transition">
                  ›
                </button>
              </div>
            </div>

            {/* Right side: Action Button */}
            <div className="w-full md:w-[120px] bg-[#FFAA14] flex items-center justify-center cursor-pointer hover:bg-yellow-500 transition-colors">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </section>
      )}
      <div className="border-[1px] border-[#D9D9D9] p-8 "></div>
      {/* Online Store Preview */}
      {storePreview.content && <StoreCarousel storePreview={storePreview} />}
      <div className="border-[1px] border-[#D9D9D9] p-8 "></div>
      {/* Stats Section */}
      {stats.content && (
        <section className="bg-white border-t border-gray-100">
          <div className="container mx-auto flex flex-col lg:flex-row">
            {/* Left Content Side */}
            <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col  border-b lg:border-b-0 lg:border-r border-gray-200">
              <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4">
                {stats.content.title}
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {stats.content.heading}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                {stats.content.paragraph_text}
              </p>
              <div>
                <a
                  href={stats.content.button_link}
                  className="inline-flex items-center gap-2 text-gray-700 font-medium border-b-2 border-gray-300 pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-all"
                >
                  {stats.content.button_text}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M7 17l10-10M7 7h10v10" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Stats Grid */}
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
              {stats.content.stats?.map((stat, i) => (
                <div
                  key={i}
                  className={`p-10 lg:p-14 border-b border-gray-200 transition-colors hover:bg-gray-50
              ${i % 2 === 0 ? "md:border-r" : ""} 
              ${i >= stats.content.stats.length - 2 ? "md:border-b-0" : ""}
            `}
                >
                  <div className="flex items-baseline gap-1 mb-2">
                    <h4
                      className={`text-5xl font-bold ${i === 0 ? "text-[#FFAA14]" : "text-gray-800"}`}
                    >
                      {stat.value.replace(/[^0-9.]/g, "")}
                    </h4>
                    <span
                      className={`text-2xl font-semibold ${i === 0 ? "text-[#FFAA14]" : "text-gray-500"}`}
                    >
                      {stat.value.replace(/[0-9.]/g, "")}
                    </span>
                  </div>

                  <p className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                    {stat.label}
                  </p>
                  <p className="text-gray-600 leading-snug max-w-sm">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <div className="border-[1px] border-[#D9D9D9] p-8 "></div>
      {/* Blog Teaser */}
      {blogTeaser.content && (
        <section className="bg-white my-12">
          <div className="container mx-auto flex flex-col lg:flex-row min-h-[600px]">
            {/* Left Content Side - Static Width */}
            <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
              <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-2">
                {blogTeaser.content.title}
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {blogTeaser.content.heading}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                {blogTeaser.content.sub_heading}
              </p>
              <div>
                <a
                  href={blogTeaser.content.button_link}
                  className="inline-flex items-center gap-2 text-gray-700 font-medium border-b-2 border-gray-300 pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-all"
                >
                  {blogTeaser.content.button_text}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M7 17l10-10M7 7h10v10" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Blog Tiles - The "Upright Rectangle" Grid */}
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
              {blogTeaser.content.posts?.slice(0, 2).map((post, i) => (
                <div
                  key={i}
                  className="relative group overflow-hidden border-r border-gray-200 last:border-r-0 aspect-[1/2] md:aspect-auto"
                >
                  {/* 1. The Image Layer */}
                  <img
                    src={
                      post.image_url ||
                      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800"
                    }
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* 2. The Dark Inset Gradient Overlay (Text Legibility) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-150" />

                  {/* 3. The Badge */}
                  <div className="absolute top-8 left-8">
                    <span className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider">
                      {i === 0 ? "News" : "Payment"}
                    </span>
                  </div>

                  {/* 4. The Content Bottom */}
                  <div className="absolute bottom-12 left-10 right-10 text-white">
                    <h3 className="text-2xl font-bold mb-3 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-6 line-clamp-2 font-light">
                      {post.excerpt}
                    </p>
                    <a
                      href={post.link}
                      className="inline-flex items-center gap-2 text-white text-sm font-semibold border-b border-white pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-colors"
                    >
                      Learn More
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path d="M7 17l10-10M7 7h10v10" />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="border-[1px] border-[#D9D9D9] p-8 "></div>
      {/* Testimonials */}
      {testimonials.content && (
        <TestimonialCarousel testimonials={testimonials} />
      )}
      <div className="border-[1px] border-[#D9D9D9] p-8 "></div>
      {/* FAQ Teaser */}
      {faqTeaser.content && (
        <section className="bg-white border-t border-gray-100">
          <div className="container mx-auto flex flex-col lg:flex-row">
            {/* Left Content Side */}
            <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col  border-b lg:border-b-0 lg:border-r border-gray-200">
              <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-4">
                {faqTeaser.content.title}
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {faqTeaser.content.heading}
              </h2>
              <p className="text-gray-500 mb-8 font-medium">
                {faqTeaser.content.sub_heading}
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <button className="bg-white border border-gray-200 text-gray-900 px-5 py-2.5 rounded-md font-semibold text-sm shadow-sm hover:bg-gray-50 transition">
                  Request a quote
                </button>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 text-gray-500 font-medium border-b border-gray-300 pb-0.5 hover:text-black transition-colors text-sm"
                >
                  Contact Us
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M7 17l10-10M7 7h10v10" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right FAQ Accordion Grid */}
            <div className="lg:w-2/3 flex flex-col">
              <div className="flex-grow">
                {faqTeaser.content.faqs?.map((faq, i) => (
                  <details
                    key={i}
                    className="group border-b border-gray-200 last:border-b-0"
                  >
                    <summary className="flex items-center justify-between p-8 lg:p-12 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                      <span className="text-xl md:text-2xl font-medium text-gray-800 pr-4">
                        {faq.question}
                      </span>
                      <span className="text-2xl text-gray-400 group-open:rotate-45 transition-transform duration-200">
                        +
                      </span>
                    </summary>
                    <div className="px-8 lg:px-12 pb-12 text-gray-600 text-lg leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>

              {/* Bottom Pagination/Navigation Row */}
              <div className="p-8 lg:p-12 flex items-center justify-between border-t border-gray-200">
                {/* Pagination Dots */}
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-900"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                </div>

                {/* Nav Arrows */}
                <div className="flex gap-4">
                  <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition shadow-sm">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition shadow-sm">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="border-[1px] border-[#D9D9D9] p-8 "></div>
      {/* CTA (Get a Quote) */}
      {cta.content && (
        <section className="bg-white ">
          <div className="container mx-auto flex flex-col lg:flex-row min-h-[500px]">
            {/* Left Image Side with Yellow Background */}
            <div className="lg:w-2/3 flex items-center justify-center p-6 lg:p-0 my-8">
              {/* The Main Image (Family) */}
              <div className="relative z-10 w-full max-w-3xl h-[400px] lg:h-[500px]">
                <img
                  src={
                    heroImage ||
                    "https://images.unsplash.com/photo-1556155099-490a1ba16284?w=1600"
                  }
                  alt="Happy Family"
                  className="w-full h-full object-cover rounded-sm shadow-2xl"
                />
              </div>
            </div>

            {/* Right Content Side */}
            <div className="lg:w-1/3 p-12 lg:p-20 flex flex-col justify-center border-l border-gray-100 bg-white">
              <span className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wider mb-8">
                {cta.content.title || "Optimize"}
              </span>

              <div className="mb-10">
                <h2 className="text-4xl md:text-5xl font-medium text-gray-500 mb-2">
                  {cta.content.heading_one}
                </h2>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                  {cta.content.heading_two}
                </h2>
              </div>

              <div>
                <a
                  href={cta.content.button_link}
                  className="inline-block bg-[#1A1102] text-white px-10 py-4 rounded-md font-bold text-sm hover:bg-black transition-all shadow-lg"
                >
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
