import { useEffect, useRef } from 'react';

/**
 * Dot-grid ambient background (style ref: pic 2 — HurairahToolsKit).
 *
 * Different technique from glow-orb backgrounds on purpose:
 * - Static grid position, only opacity pulses. Motion in a dot-grid reads as
 *   "glitchy" if dots drift — the premium version is a texture that breathes,
 *   not one that moves.
 * - Radial mask fades dots out near the edges so the pattern frames the hero
 *   copy instead of competing with it for attention.
 * - Each dot has its own randomized pulse phase/speed so nothing pulses in
 *   sync — synced pulsing reads as a loading animation, not texture.
 */

const DotGridBg = ({
  color = '#FC6C26',
  spacing = 30,
  dotRadius = 1.6,
  baseOpacity = 0.22,
  pulseAmount = 0.15,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let dots = [];
    let raf;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const buildGrid = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      dots = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            x: i * spacing,
            y: j * spacing,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 0.5,
            sizeJitter: 0.7 + Math.random() * 0.6,
          });
        }
      }
    };

    buildGrid();
    window.addEventListener('resize', buildGrid);

    const cx = () => width / 2;
    const cy = () => height / 2;
    const maxDist = () => Math.hypot(width / 2, height / 2);

    let time = 0;
    let last = performance.now();
    const animate = (now) => {
      raf = requestAnimationFrame(animate);
      const dt = (now - last) / 1000;
      last = now;
      time += dt;

      ctx.clearRect(0, 0, width, height);

      for (const d of dots) {
        const dist = Math.hypot(d.x - cx(), d.y - cy());
        const edgeFade = Math.max(0, 1 - dist / maxDist());

        const pulse = Math.sin(time * d.speed + d.phase) * pulseAmount;
        const opacity = Math.max(0, (baseOpacity + pulse) * edgeFade);

        if (opacity <= 0.01) continue;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.arc(d.x, d.y, dotRadius * d.sizeJitter, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', buildGrid);
    };
  }, [color, spacing, dotRadius, baseOpacity, pulseAmount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default DotGridBg;