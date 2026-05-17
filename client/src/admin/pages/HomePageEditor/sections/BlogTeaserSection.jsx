/**
 * BlogTeaserSection.jsx
 *
 * Renders the blog teaser section with a left text panel and two post cards.
 * Post images use the "featured" and "thumbnail" media roles respectively.
 */

import EditableText    from "../components/EditableText";
import EditableImage   from "../components/EditableImage";
import EditableSection from "../components/EditableSection";
import { ROLE }        from "../api/homepageApi";

/**
 * @param {{
 *   blogTeaser      : object,
 *   onUpdateContent : (field: string, value: string) => void,
 *   onUpdatePost    : (index: number, field: string, value: string) => void,
 *   onMediaSuccess  : (role: string, url: string) => void,
 *   onDelete        : () => void,
 * }} props
 */
const BlogTeaserSection = ({
  blogTeaser,
  onUpdateContent,
  onUpdatePost,
  onMediaSuccess,
  onDelete,
}) => (
  <EditableSection label="Blog Teaser" onDelete={onDelete}>
    <section className="bg-white my-12">
      <div className="container mx-auto flex flex-col lg:flex-row min-h-[600px]">

        {/* Left: heading + description + CTA */}
        <div className="lg:w-1/3 p-8 lg:p-16 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">
          <EditableText
            content={blogTeaser.content.title}
            onChange={(v) => onUpdateContent("title", v)}
            className="text-[#FFAA14] text-sm font-semibold uppercase tracking-wide mb-2 block"
            placeholder="Label…"
          />
          <EditableText
            content={blogTeaser.content.heading}
            onChange={(v) => onUpdateContent("heading", v)}
            className="text-4xl font-bold text-gray-800 mb-6 block"
            tag="h2"
            placeholder="Heading…"
          />
          <EditableText
            content={blogTeaser.content.sub_heading}
            onChange={(v) => onUpdateContent("sub_heading", v)}
            className="text-gray-600 leading-relaxed mb-8 block"
            placeholder="Sub-heading…"
          />
          <a className="inline-flex items-center gap-2 text-gray-700 font-medium border-b-2 border-gray-300 pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-all cursor-pointer">
            <EditableText
              content={blogTeaser.content.button_text}
              onChange={(v) => onUpdateContent("button_text", v)}
              className="inline"
              placeholder="CTA…"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17l10-10M7 7h10v10" />
            </svg>
          </a>
        </div>

        {/* Right: post cards (first 2 posts) */}
        <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2">
          {blogTeaser.content.posts?.slice(0, 2).map((post, i) => {
            // Use "featured" role for first post, "thumbnail" for second
            const imgRole = i === 0 ? ROLE.FEATURED : ROLE.THUMBNAIL;

            return (
              <div
                key={i}
                className="relative group overflow-hidden border-r border-gray-200 last:border-r-0 aspect-[1/2] md:aspect-auto"
              >
                <EditableImage
                  src={post.image_url || "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800"}
                  alt={post.title || "Blog post"}
                  sectionId={blogTeaser.id}
                  role={imgRole}
                  onUrlChange={(url) => {
                    onUpdatePost(i, "image_url", url);
                    onMediaSuccess(imgRole, url);
                  }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

                <div className="absolute top-8 left-8">
                  <span className="bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider">
                    {i === 0 ? "News" : "Payment"}
                  </span>
                </div>

                <div className="absolute bottom-12 left-10 right-10 text-white">
                  <EditableText
                    content={post.title}
                    onChange={(v) => onUpdatePost(i, "title", v)}
                    className="text-2xl font-bold mb-3 leading-tight block"
                    tag="h3"
                    placeholder="Post title…"
                  />
                  <EditableText
                    content={post.excerpt}
                    onChange={(v) => onUpdatePost(i, "excerpt", v)}
                    className="text-gray-300 text-sm mb-6 line-clamp-2 font-light block"
                    placeholder="Excerpt…"
                  />
                  <a className="inline-flex items-center gap-2 text-white text-sm font-semibold border-b border-white pb-1 hover:text-[#FFAA14] hover:border-[#FFAA14] transition-colors cursor-pointer">
                    Learn More
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M7 17l10-10M7 7h10v10" />
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  </EditableSection>
);

export default BlogTeaserSection;
