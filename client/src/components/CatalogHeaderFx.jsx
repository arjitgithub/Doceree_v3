import { useEffect, useRef } from "react";

export default function CatalogHeaderFx() {
  const hostRef = useRef(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    // Ensure scripts are actually loaded
    const hasThree = typeof window !== "undefined" && window.THREE;
    const hasBirds =
      typeof window !== "undefined" &&
      window.VANTA &&
      typeof window.VANTA.BIRDS === "function";

    if (!hasThree || !hasBirds) {
      // If this logs, your scripts are not being served from /public or not loaded in index.html
      console.warn("Vanta not ready:", { hasThree: !!hasThree, hasBirds: !!hasBirds });
      return;
    }

    vantaRef.current = window.VANTA.BIRDS({
      el,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,

      // White background
      backgroundColor: 0xffffff,
      backgroundAlpha: 1.0, // IMPORTANT: if you keep 0, it becomes transparent

      // “Vanta-like” multi birds feel
      color1: 0x000000,
      color2: 0x7c9ba7,
      colorMode: "lerpGradient",
      birdSize: 1.2,
      wingSpan: 17.0,
      separation: 34.0,
      alignment: 100.0,
      cohesion: 93.0,
      quantity: 4.0,
    });

    return () => {
      if (vantaRef.current) {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };
  }, []);

  return <div ref={hostRef} className="catalogHeaderFxCanvas" />;
}
