export const scrollToTop = (options = { behavior: 'smooth', left: 0, top: 0 }) => {
  if (typeof window === 'undefined') return;

  const scrollOptions = {
    left: options.left ?? 0,
    top: options.top ?? 0,
    behavior: options.behavior ?? 'smooth',
  };

  window.scrollTo(scrollOptions);
};
