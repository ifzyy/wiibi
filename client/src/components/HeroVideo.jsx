/**
 * HeroVideo — autoplaying, muted, looping YouTube embed sized as a 16:9 hero
 * media panel. Decorative only (no controls, pointer-events disabled), so it
 * reads as a background video rather than a clickable player.
 *
 * Renders nothing when the URL doesn't resolve to a video id, which lets
 * callers fall back to a still image.
 */
import { getYouTubeId, buildHeroEmbedUrl } from '../utils/youtube.js';

export default function HeroVideo({ url, title = 'Solar energy', className = '' }) {
  const id = getYouTubeId(url);
  if (!id) return null;

  return (
    <div className={`relative w-full aspect-video rounded-sm overflow-hidden bg-black ${className}`}>
      <iframe
        src={buildHeroEmbedUrl(id)}
        title={title}
        className="absolute inset-0 w-full h-full pointer-events-none"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        frameBorder="0"
      />
    </div>
  );
}
