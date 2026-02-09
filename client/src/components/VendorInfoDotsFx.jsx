import { useEffect, useRef } from "react";

function randFromPalette() {
  // Choose colors that look good on white
  const palette = [
    0x946cdc, // purple
    0x7c9ba7, // blue-gray
    0x0b2404, // deep green
    0xff7a00, // orange
    0x1c3cff, // blue
    0x111827, // near-black
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

export default function VendorInfoDotsFx() {
  const hostRef = useRef(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    if (!window.VANTA?.DOTS) {
      console.error("VANTA.DOTS not found. Ensure /vanta.dots.min.js is loaded in index.html");
      return;
    }

    const color = randFromPalette();

    vantaRef.current = window.VANTA.DOTS({
      el,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,

      backgroundColor: 0xffffff,
      backgroundAlpha: 1.0,

      color,         
      color2: 0xffffff,

      size: 4.8,
      spacing: 70.0,
      showLines: false,
    });

    return () => {
      vantaRef.current?.destroy?.();
      vantaRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className="vendorInfoFxCanvas" aria-hidden="true" />;
}
