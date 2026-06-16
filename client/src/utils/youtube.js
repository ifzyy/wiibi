/**
 * youtube — extract a video id from the common YouTube URL shapes so a hero
 * (or any embed) can be driven by a plain URL pasted into the CMS.
 *
 * Accepts:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   ID            (a bare 11-char id)
 * Returns the 11-char id, or null when nothing usable is found.
 */
export const getYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  const m = s.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;   // already a bare id
  return null;
};

/**
 * Build an embed URL for a muted, looping, chrome-less background video.
 * Muted is required for browsers to allow autoplay. Uses the privacy-friendly
 * nocookie host. `loop` needs `playlist=<id>` to actually repeat.
 */
export const buildHeroEmbedUrl = (id) =>
  `https://www.youtube-nocookie.com/embed/${id}` +
  `?autoplay=1&mute=1&loop=1&playlist=${id}` +
  `&controls=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&iv_load_policy=3`;
