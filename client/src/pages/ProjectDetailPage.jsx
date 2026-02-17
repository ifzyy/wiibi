import React from "react";
import { ArrowLeft } from "lucide-react";

const ProjectDetailPage = () => {
  // Mock Data based on the Horse Bikes Case Study image
  const caseStudy = {
    title: "Horse bikes production Plant",
    year: "2025",
    gallery: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
      "https://images.unsplash.com/photo-1565608876127-130029bc952f?w=800",
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800",
      "https://images.unsplash.com/photo-1485081666428-269a767462d2?w=800",
    ],
    overview:
      "Wiibi Energy partnered with Horse Bikes, a fast-rising Nigerian production house known for creating innovative mobility concepts and multimedia content. The goal was to provide a dependable, solar-powered energy system that would eliminate their reliance on unstable grid electricity and expensive petrol generators—two major obstacles facing creative and manufacturing businesses in Nigeria today.",
    problem: [
      "Wiibi Like many small to mid-scale studios in Nigeria, Horse Bikes struggled with NEPA wahala—frequent power outages, voltage fluctuations, and irregular supply. These interruptions made it difficult to meet deadlines, run essential equipment, and deliver consistent results to clients.",
      "To stay productive, they relied heavily on generators, which came with high fuel costs, constant repairs, and noise pollution. It also conflicted with their mission to operate as an environmentally responsible brand.",
    ],
    solution: {
      intro:
        "After carrying out a detailed energy audit, Wiibi Energy designed a custom solar solution built to match the unique load profile of a hybrid production and fabrication space. This included:",
      points: [
        "High-efficiency solar panels mounted for optimal sun exposure",
        "Long-life battery backups to cover night work or low-sun periods",
        "Smart inverters with surge protection for sensitive creative gear",
        "A low-maintenance system built to handle Nigerian weather conditions",
        "Staff orientation for day-to-day energy management",
      ],
    },
    results: [
      "Uninterrupted power for daily operations, even during prolonged blackouts",
      "60-70% drop in energy costs, allowing reallocation of funds to creative expansion",
      "Zero dependence on fuel for generators",
      "Better working conditions—quieter, cleaner, and more reliable",
      "Strengthened brand image as a modern, eco-conscious business",
    ],
    conclusion:
      "Wiibi Energy played a key role in turning Horse Bikes into a fully solar-powered creative hub. The success of this project reflects Wiibi's broader mission: helping Nigerian businesses move away from the grid and into the future, using clean energy to unlock productivity, independence, and sustainability.",
  };

  return (
    <main className="bg-white min-h-screen pb-24">
      {/* --- HEADER --- */}
      <header className="max-w-4xl mx-auto px-6 pt-20 mb-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#FFAA14 ] -400 hover:text-[#FFAA14 ]   transition-colors mb-12 text-sm font-bold"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <h1 className="text-4xl font-black text-[#FFAA14 ]   mb-2">
          {caseStudy.title}
        </h1>
        <p className="text-lg font-medium text-[#FFAA14 ] -400">
          {caseStudy.year}
        </p>
      </header>

      {/* --- HORIZONTAL GALLERY --- */}
      <section className="mb-20 overflow-x-auto no-scrollbar">
        <div className="flex gap-6 px-6 min-w-max">
          {caseStudy.gallery.map((img, idx) => (
            <div
              key={idx}
              className="w-[450px] aspect-[4/3] bg-[#FFAA14 ] -100 rounded-2xl overflow-hidden border  border-stone-50 -100"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* --- ARTICLE CONTENT --- */}
      <article className="max-w-4xl mx-auto px-6 space-y-16">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-black text-[#FFAA14 ]   mb-6">
            Overview
          </h2>
          <p className="text-[#FFAA14 ] -600 leading-relaxed text-lg font-medium">
            {caseStudy.overview}
          </p>
        </section>

        {/* The Problem */}
        <section>
          <h2 className="text-xl font-black text-[#FFAA14 ]   mb-6">
            The Problem
          </h2>
          <div className="space-y-6 text-[#FFAA14 ] -600 leading-relaxed text-lg font-medium">
            {caseStudy.problem.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* Wiibi Energy's Solution */}
        <section>
          <h2 className="text-xl font-black text-[#FFAA14 ]   mb-6">
            Wiibi Energy's Solution
          </h2>
          <p className="text-[#FFAA14 ] -600 leading-relaxed text-lg font-medium mb-8">
            {caseStudy.solution.intro}
          </p>
          <ul className="space-y-4">
            {caseStudy.solution.points.map((point, i) => (
              <li
                key={i}
                className="flex gap-4 text-[#FFAA14 ] -600 text-lg font-medium"
              >
                <span className="text-amber-500 font-bold">•</span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Results & Impact */}
        <section>
          <h2 className="text-xl font-black text-[#FFAA14 ]   mb-6">
            Results & Impact
          </h2>
          <p className="text-[#FFAA14 ] -600 text-lg font-medium mb-6">
            Since installation, Horse Bikes has enjoyed:
          </p>
          <ul className="space-y-4">
            {caseStudy.results.map((result, i) => (
              <li
                key={i}
                className="flex gap-4 text-[#FFAA14 ] -600 text-lg font-medium leading-tight"
              >
                <div className="w-1.5 h-1.5 bg-[#FFAA14 ]   rounded-full mt-2.5 flex-shrink-0" />
                {result}
              </li>
            ))}
          </ul>
        </section>

        {/* Conclusion */}
        <section className="pt-16 border-t  border-stone-50 -100">
          <h2 className="text-xl font-black text-[#FFAA14 ]   mb-6">
            Conclusion
          </h2>
          <p className="text-[#FFAA14 ] -600 leading-relaxed text-lg font-medium mb-4">
            {caseStudy.conclusion}
          </p>
          <p className="text-[#FFAA14 ]   font-bold italic">
            Strengthened brand image as a modern, eco-conscious business
          </p>
        </section>
      </article>

      {/* --- CTA FOOTER --- */}
      <footer className="max-w-4xl mx-auto px-6 mt-24">
        <div className="bg-[#FFAA14 ] -50 rounded-3xl p-12 text-center border  border-stone-50 -100">
          <h3 className="text-2xl font-black text-[#FFAA14 ]   mb-4">
            Ready to power your business?
          </h3>
          <p className="text-[#FFAA14 ] -500 mb-8 max-w-md mx-auto">
            Join Horse Bikes and dozens of other Nigerian firms switching to
            reliable solar energy.
          </p>
          <a
            href="/quote"
            className="inline-block bg-[#FFAA14] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-[#e59912] transition-colors"
          >
            Get a Free Quote
          </a>
        </div>
      </footer>
    </main>
  );
};

export default ProjectDetailPage;
