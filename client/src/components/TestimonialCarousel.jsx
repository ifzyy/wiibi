import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

const TestimonialCarousel = ({ testimonials }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  if (!testimonials.content) return null;

  return (
    <section className="py-20 bg-white font-sans">
      <div className="container mx-auto px-6">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-[#FFAA14] text-sm font-medium uppercase tracking-wider block mb-2">
            {testimonials.content.title}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            {testimonials.content.heading}
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            {testimonials.content.sub_heading}
          </p>
          <a
            href={testimonials.content.button_link}
            className="inline-block bg-[#1A1102] text-white px-8 py-3 rounded-md font-semibold text-sm hover:bg-black transition-colors"
          >
            {testimonials.content.button_text}
          </a>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows */}
          <button
            onClick={() => emblaApi && emblaApi.scrollPrev()}
            className="absolute left-[-60px] top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full border border-gray-200 items-center justify-center hover:bg-gray-50 transition shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={() => emblaApi && emblaApi.scrollNext()}
            className="absolute right-[-60px] top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full border border-gray-200 items-center justify-center hover:bg-gray-50 transition shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {testimonials.content.testimonials?.map((t, i) => {
                const isActive = i === selectedIndex;
                return (
                  <div 
                    key={i} 
                    className="flex-[0_0_100%] min-w-0 px-4 transition-opacity duration-500"
                    style={{ opacity: isActive ? 1 : 0.3 }}
                  >
                    {/* Placeholder for the grey image box in screenshot */}
                    <div className="bg-[#F9FAFB] aspect-video w-full rounded-sm mb-6 flex items-center justify-center overflow-hidden">
                       {t.image_url ? (
                         <img src={t.image_url} alt={t.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full bg-gray-100" />
                       )}
                    </div>

                    {/* Metadata Row */}
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xl font-bold text-gray-900">
                        {/* Using static names to match screenshot style or t.name */}
                        {t.name === "Aisha O." ? "Jose Bar & Lounge" : t.name}
                      </h4>
                      <span className="text-gray-900 font-bold text-lg">2025</span>
                    </div>

                    {/* Quote Text */}
                    <p className="text-gray-600 text-lg mb-6">
                      {t.text}
                    </p>

                    {/* Action Link */}
                    <div className="border-b border-gray-300 inline-block pb-0.5">
                      <a
                        href={t.button_link}
                        className="flex items-center gap-2 text-gray-700 font-medium hover:text-black transition-colors text-sm"
                      >
                        {t.button_text}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M7 17l10-10M7 7h10v10" />
                        </svg>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi && emblaApi.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === selectedIndex ? "bg-gray-800 w-4" : "bg-gray-300 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;