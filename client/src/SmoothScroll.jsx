import Lenis from 'lenis'
import { useEffect } from "react";

function SmoothScroll({ children }) {
  useEffect(() => {
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
  smoothTouch: false,
})
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }, []);

  return children;
}

export default SmoothScroll;
