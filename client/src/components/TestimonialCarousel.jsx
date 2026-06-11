import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TestimonialCarousel = ({ testimonials }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  }, [Autoplay({ delay: 4000, stopOnInteraction: true })]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  // ── Fetch projects ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API_BASE}/public/projects`, {
          params: { limit: 10 },
        });
        setProjects(res.data.projects || []);
      } catch (err) {
        console.error("Failed to load projects for carousel:", err);
      }
    };
    fetchProjects();
  }, []);

  // ── Embla setup ─────────────────────────────────────────────────────────────
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

  if (!testimonials?.content) return null;
  if (projects.length === 0) return null;

  return (
    <section className="py-20 bg-white font-sans">
      <div className="container mx-auto px-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-12">
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

        {/* ── Carousel ───────────────────────────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto">

          {/* Prev arrow */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-[-60px] top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full border border-gray-200 items-center justify-center hover:bg-gray-50 transition shadow-sm z-10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-[-60px] top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full border border-gray-200 items-center justify-center hover:bg-gray-50 transition shadow-sm z-10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {projects.map((project, i) => {
                const isActive       = i === selectedIndex;
                const galleryImages  = project.galleryImages || [];
                const thumbUrl       = galleryImages[0]?.url || null;
                const isCase         = project.type === "case_study";

                return (
                  <div
                    key={project.id}
                    className="flex-[0_0_100%] min-w-0 px-4 transition-opacity duration-500"
                    style={{ opacity: isActive ? 1 : 0.3 }}
                  >
                    {/* Project image */}
                    <div className="w-full rounded-2xl overflow-hidden bg-stone-100 mb-6"
                      style={{ aspectRatio: "16/9" }}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-100" />
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FFAA14] block mb-1">
                          {isCase ? "Case Study" : "Project"}
                        </span>
                        <h4 className="text-xl font-black text-gray-900">
                          {project.title}
                        </h4>
                      </div>
                      <span className="text-gray-400 font-bold text-base">
                        {project.year}
                      </span>
                    </div>

                    {/* Overview snippet — strip HTML tags for plain text preview */}
                    {project.overview && (
                      <p className="text-gray-500 text-base leading-relaxed mb-6 line-clamp-3">
                        {project.overview.replace(/<[^>]+>/g, "")}
                      </p>
                    )}

                    {/* Action link */}
                    <div className="inline-block border-b border-gray-300 pb-0.5">
                      <button
                        onClick={() => navigate(`/projects/${project.slug}`)}
                        className="flex items-center gap-2 text-gray-700 font-semibold hover:text-[#FFAA14] transition-colors text-sm"
                      >
                        {isCase ? "Read case study" : "See more photos"}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M7 17l10-10M7 7h10v10" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
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