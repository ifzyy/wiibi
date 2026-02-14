import { EditableText, EditableImage } from '../components/Editable.jsx';

// ── Hero ──────────────────────────────────────────────────────────────────────
export const HeroSection = ({ content, onChange }) => {
  const u = (f, v) => onChange({ ...content, [f]: v });
  return (
    <section className="bg-white">
      <div className="min-h-[85vh] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-[0.9] lg:pr-12">
            <EditableText value={content.subtitle} onChange={v => u('subtitle', v)} as="p"
              className="text-amber-500 font-semibold uppercase tracking-wider text-sm mb-6" />
            <EditableText value={content.title} onChange={v => u('title', v)} as="h1" multiline
              className="text-[#1A1102] text-5xl xl:text-7xl font-bold leading-tight mb-8" />
            <EditableText value={content.main_support_text} onChange={v => u('main_support_text', v)} as="p" multiline
              className="text-[#606060] text-lg xl:text-xl font-medium max-w-xl mb-10 leading-relaxed" />
            <div className="flex gap-4 mb-12">
              <button className="bg-[#1A1102] px-8 py-4 text-white font-bold rounded-md">View our packages</button>
            </div>
            <div className="text-xl mb-3">🌸</div>
            <EditableText value={content.second_support_text} onChange={v => u('second_support_text', v)} as="p" multiline
              className="font-light text-[#606060] text-[17px] max-w-[260px]" />
          </div>
          <div className="flex-[1.1] w-full aspect-[4/3] rounded-sm overflow-hidden shadow-2xl">
            <EditableImage
              src={content.hero_image_url || 'https://images.unsplash.com/photo-1583345237708-add35a664d77?w=1600&auto=format&fit=crop&q=80'}
              alt="Hero" onChange={v => u('hero_image_url', v)} className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      <div className="w-full border-t border-b border-gray-100 flex flex-col md:flex-row">
        <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100">
          <EditableText value={content.question_text} onChange={v => u('question_text', v)} as="h3"
            className="text-xl font-bold uppercase tracking-tighter mb-2" />
          <EditableText value={content.confidence_text} onChange={v => u('confidence_text', v)} as="p"
            className="text-gray-500 font-medium" />
        </div>
        <div className="flex-1 p-8 lg:p-12 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-gray-900 block mb-2">Solar Calculator</span>
            <h4 className="text-4xl lg:text-5xl font-bold">₦125,000</h4>
          </div>
          <span className="bg-gray-50 px-4 py-2 rounded-md text-sm font-bold">Monthly</span>
        </div>
        <div className="w-full md:w-[120px] bg-amber-400 flex items-center justify-center min-h-[80px] cursor-pointer hover:bg-amber-500 transition-colors">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
        </div>
      </div>
    </section>
  );
};

// ── Store Preview ─────────────────────────────────────────────────────────────
export const StorePreviewSection = ({ content, onChange }) => {
  const u = (f, v) => onChange({ ...content, [f]: v });
  const updProd = (i, f, v) => { const p = [...(content.products || [])]; p[i] = { ...p[i], [f]: v }; u('products', p); };
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <EditableText value={content.title} onChange={v => u('title', v)} as="span"
              className="text-amber-500 text-sm font-semibold uppercase tracking-wide block mb-1" />
            <EditableText value={content.heading} onChange={v => u('heading', v)} as="h2"
              className="text-3xl font-bold text-gray-900" />
          </div>
          <EditableText value={content.button_text} onChange={v => u('button_text', v)} as="span"
            className="text-gray-700 font-medium border-b-2 border-gray-300 pb-1 text-sm cursor-text" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {(content.products || []).slice(0, 4).map((prod, i) => (
            <div key={i} className="group/card rounded-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="aspect-square overflow-hidden bg-gray-50">
                <EditableImage src={prod.image_url} alt={prod.name} onChange={v => updProd(i, 'image_url', v)}
                  className="w-full h-full object-cover transition-transform group-hover/card:scale-105" />
              </div>
              <div className="p-4">
                <EditableText value={prod.name} onChange={v => updProd(i, 'name', v)} as="h4"
                  className="font-semibold text-gray-900 mb-1 text-sm" />
                <EditableText value={prod.price} onChange={v => updProd(i, 'price', v)} as="p"
                  className="text-amber-500 font-bold" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Stats ─────────────────────────────────────────────────────────────────────
export const StatsSection = ({ content, onChange }) => {
  const u = (f, v) => onChange({ ...content, [f]: v });
  const updStat = (i, f, v) => { const s = [...(content.stats || [])]; s[i] = { ...s[i], [f]: v }; u('stats', s); };
  return (
    <section className="bg-white border-t border-gray-100">
      <div className="container mx-auto flex flex-col lg:flex-row">
        <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
          <EditableText value={content.title} onChange={v => u('title', v)} as="span"
            className="text-amber-500 text-sm font-semibold uppercase tracking-wide mb-4" />
          <EditableText value={content.heading} onChange={v => u('heading', v)} as="h2" multiline
            className="text-4xl font-bold text-gray-900 mb-6" />
          <EditableText value={content.paragraph_text} onChange={v => u('paragraph_text', v)} as="p" multiline
            className="text-gray-600 leading-relaxed mb-8" />
        </div>
        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
          {(content.stats || []).map((stat, i) => (
            <div key={i} className={`p-10 lg:p-14 border-b border-gray-200 hover:bg-gray-50 transition-colors
              ${i % 2 === 0 ? 'md:border-r' : ''} ${i >= (content.stats.length - 2) ? 'md:border-b-0' : ''}`}>
              <EditableText value={stat.value} onChange={v => updStat(i, 'value', v)} as="h4"
                className={`text-5xl font-bold mb-2 ${i === 0 ? 'text-amber-500' : 'text-gray-800'}`} />
              <EditableText value={stat.label} onChange={v => updStat(i, 'label', v)} as="p"
                className="text-lg font-semibold text-gray-900 mb-4 capitalize" />
              <EditableText value={stat.description} onChange={v => updStat(i, 'description', v)} as="p" multiline
                className="text-gray-600 leading-snug max-w-sm" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Blog Teaser ───────────────────────────────────────────────────────────────
export const BlogTeaserSection = ({ content, onChange }) => {
  const u = (f, v) => onChange({ ...content, [f]: v });
  const updPost = (i, f, v) => { const p = [...(content.posts || [])]; p[i] = { ...p[i], [f]: v }; u('posts', p); };
  return (
    <section className="bg-white my-12">
      <div className="container mx-auto flex flex-col lg:flex-row min-h-[600px]">
        <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
          <EditableText value={content.title} onChange={v => u('title', v)} as="span"
            className="text-amber-500 text-sm font-semibold uppercase tracking-wide mb-2" />
          <EditableText value={content.heading} onChange={v => u('heading', v)} as="h2" multiline
            className="text-4xl font-bold text-gray-900 mb-6" />
          <EditableText value={content.sub_heading} onChange={v => u('sub_heading', v)} as="p" multiline
            className="text-gray-600 leading-relaxed mb-8" />
        </div>
        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
          {(content.posts || []).slice(0, 2).map((post, i) => (
            <div key={i} className="relative group/post overflow-hidden border-r border-gray-200 last:border-r-0 min-h-[400px]">
              <EditableImage src={post.image_url || 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800'}
                alt={post.title} onChange={v => updPost(i, 'image_url', v)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/post:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute top-8 left-8">
                <span className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider">
                  {i === 0 ? 'News' : 'Guide'}
                </span>
              </div>
              <div className="absolute bottom-12 left-10 right-10 text-white">
                <EditableText value={post.title} onChange={v => updPost(i, 'title', v)} as="h3" multiline
                  className="text-2xl font-bold mb-3 leading-tight text-white" />
                <EditableText value={post.excerpt} onChange={v => updPost(i, 'excerpt', v)} as="p" multiline
                  className="text-gray-300 text-sm mb-4 font-light" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Testimonials ──────────────────────────────────────────────────────────────
export const TestimonialsSection = ({ content, onChange }) => {
  const u = (f, v) => onChange({ ...content, [f]: v });
  const updT = (i, f, v) => { const t = [...(content.testimonials || [])]; t[i] = { ...t[i], [f]: v }; u('testimonials', t); };
  return (
    <section className="bg-stone-50 py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <EditableText value={content.title} onChange={v => u('title', v)} as="span"
            className="text-amber-500 text-sm font-semibold uppercase tracking-wide block mb-2" />
          <EditableText value={content.heading} onChange={v => u('heading', v)} as="h2"
            className="text-4xl font-bold text-gray-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(content.testimonials || []).map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-stone-100">
              <div className="text-amber-400 text-3xl font-serif mb-4 leading-none">"</div>
              <EditableText value={t.quote} onChange={v => updT(i, 'quote', v)} as="p" multiline
                className="text-gray-700 mb-6 leading-relaxed" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm flex-shrink-0">
                  {(t.name || 'U').charAt(0)}
                </div>
                <div>
                  <EditableText value={t.name} onChange={v => updT(i, 'name', v)} as="p"
                    className="font-bold text-gray-900 text-sm" />
                  <EditableText value={t.role} onChange={v => updT(i, 'role', v)} as="p"
                    className="text-gray-500 text-xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── FAQ Teaser ────────────────────────────────────────────────────────────────
export const FaqTeaserSection = ({ content, onChange }) => {
  const u = (f, v) => onChange({ ...content, [f]: v });
  const updFaq = (i, f, v) => { const fa = [...(content.faqs || [])]; fa[i] = { ...fa[i], [f]: v }; u('faqs', fa); };
  return (
    <section className="bg-white border-t border-gray-100">
      <div className="container mx-auto flex flex-col lg:flex-row">
        <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
          <EditableText value={content.title} onChange={v => u('title', v)} as="span"
            className="text-amber-500 text-sm font-semibold uppercase tracking-wide mb-4" />
          <EditableText value={content.heading} onChange={v => u('heading', v)} as="h2" multiline
            className="text-4xl font-bold text-gray-900 mb-6 leading-tight" />
          <EditableText value={content.sub_heading} onChange={v => u('sub_heading', v)} as="p" multiline
            className="text-gray-500 mb-8 font-medium" />
        </div>
        <div className="lg:w-2/3">
          {(content.faqs || []).map((faq, i) => (
            <details key={i} className="group/faq border-b border-gray-200 last:border-b-0">
              <summary className="flex items-center justify-between p-8 lg:p-10 cursor-pointer list-none hover:bg-gray-50 transition-colors">
                <EditableText value={faq.question} onChange={v => updFaq(i, 'question', v)} as="span"
                  className="text-xl font-medium text-gray-800 pr-4" />
                <span className="text-2xl text-gray-400 group-open/faq:rotate-45 transition-transform duration-200 flex-shrink-0">+</span>
              </summary>
              <div className="px-8 lg:px-10 pb-8">
                <EditableText value={faq.answer} onChange={v => updFaq(i, 'answer', v)} as="p" multiline
                  className="text-gray-600 text-lg leading-relaxed" />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── CTA ───────────────────────────────────────────────────────────────────────
export const CtaSection = ({ content, onChange }) => {
  const u = (f, v) => onChange({ ...content, [f]: v });
  return (
    <section className="bg-white">
      <div className="container mx-auto flex flex-col lg:flex-row min-h-[500px]">
        <div className="lg:w-2/3 flex items-center justify-center p-6 my-8">
          <div className="relative z-10 w-full max-w-3xl h-[400px] lg:h-[500px] rounded-sm overflow-hidden shadow-2xl">
            <EditableImage
              src={content.image_url || 'https://images.unsplash.com/photo-1556155099-490a1ba16284?w=1600'}
              alt="CTA" onChange={v => u('image_url', v)} className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="lg:w-1/3 p-12 lg:p-20 flex flex-col justify-center border-l border-gray-100">
          <EditableText value={content.title} onChange={v => u('title', v)} as="span"
            className="text-amber-500 text-sm font-semibold uppercase tracking-wider mb-8 block" />
          <EditableText value={content.heading_one} onChange={v => u('heading_one', v)} as="h2"
            className="text-4xl md:text-5xl font-medium text-gray-500 mb-2" />
          <EditableText value={content.heading_two} onChange={v => u('heading_two', v)} as="h2"
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-10" />
          <a className="inline-block bg-[#1A1102] text-white px-10 py-4 rounded-md font-bold text-sm hover:bg-black transition-all shadow-lg cursor-pointer">
            <EditableText value={content.button_text} onChange={v => u('button_text', v)} as="span" className="text-white" />
          </a>
        </div>
      </div>
    </section>
  );
};

export const SECTION_RENDERERS = {
  'hero':          HeroSection,
  'store-preview': StorePreviewSection,
  'stats':         StatsSection,
  'blog-teaser':   BlogTeaserSection,
  'testimonials':  TestimonialsSection,
  'faq-teaser':    FaqTeaserSection,
  'cta':           CtaSection,
};
