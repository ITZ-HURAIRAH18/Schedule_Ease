'use client';

import { useMemo, useState, useEffect } from 'react';

const MAX_U32 = 4294967295;

// Deterministic 32-bit integer hash — same result in Node.js and browser
function hashInt(seed: number): number {
  let x = (seed << 13) >>> 0;
  x = ((x * 48271) >>> 0) % 2147483647;
  x = (x * 16807) >>> 0;
  return x >>> 0;
}

// Float 0-1 from hash
function hashFloat(seed: number): number {
  return hashInt(seed) / MAX_U32;
}

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const dots = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => {
      const seed = i + 1;
      const size = 4 + hashFloat(seed) * 8;
      const left = hashFloat(seed + 100) * 100;
      const top = hashFloat(seed + 200) * 100;
      const delay = hashFloat(seed + 300) * 4;
      const duration = 4 + hashFloat(seed + 400) * 6;
      const opacity = 0.08 + hashFloat(seed + 500) * 0.15;
      const animIndex = i % 3;
      const animation = animIndex === 0 ? 'dotPulse' : animIndex === 1 ? 'float-dots-fast' : 'dotFloat';
      return { size, left, top, delay, duration, opacity, animation, key: i };
    })
  , []);

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#F0F9F2',
        paddingTop: '88px',
        paddingBottom: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        minHeight: '520px',
      }}
    >
      {/* Animated dot gradient layers */}
      <div
        className="animated-dots-layer"
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.6 }}
      />
      <div
        className="animated-dots-layer-2"
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }}
      />
      <div
        className="animated-dots-layer-3"
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.4 }}
      />

      {/* Floating dot orbs — larger, softer */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,107,58,0.12) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'dotFloat 7s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '60%',
          right: '8%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,107,58,0.1) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'dotFloat 9s ease-in-out infinite reverse',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '40%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,107,58,0.08) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'dotFloat 6s ease-in-out infinite 2s',
        }}
      />

      {/* Scattered individual dots — deterministic positions */}
      {dots.map(dot => (
        <span
          key={dot.key}
          style={{
            position: 'absolute',
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            borderRadius: '50%',
            backgroundColor: '#1A6B3A',
            opacity: dot.opacity,
            zIndex: 1,
            pointerEvents: 'none',
            animation: `${dot.animation} ${dot.duration}s ease-in-out infinite ${dot.delay}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* LAYER 1: Radial fade overlay — keeps the center clean where text lives */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(
            ellipse 58% 48% at 50% 45%,
            #F0F9F2 0%,
            rgba(240, 249, 242, 0.96) 24%,
            rgba(240, 249, 242, 0.62) 48%,
            rgba(240, 249, 242, 0.16) 70%,
            transparent 100%
          )`,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* LAYER 2: All hero content */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          maxWidth: '680px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1.5px solid #C4E0CA',
            borderRadius: '999px',
            padding: '6px 16px',
            marginBottom: '28px',
            boxShadow: '0 1px 6px rgba(26,107,58,0.08)',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#1A6B3A',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#1A6B3A',
              letterSpacing: '0.1px',
            }}
          >
            47 Free Tools — No Signup Required
          </span>
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: 'var(--font-bricolage)',
            fontSize: 'clamp(38px, 5.5vw, 68px)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-1.5px',
            marginBottom: '20px',
          }}
        >
          <span style={{ color: '#0A2415', display: 'block' }}>
            Every tool a student
          </span>
          <span style={{ color: '#1A6B3A', display: 'block' }}>
            actually needs.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '17px',
            color: '#4A6B55',
            lineHeight: 1.65,
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto 32px',
            fontWeight: 400,
          }}
        >
          PDF, image, developer, and university utilities. All run in
          your browser. Your files never leave your device.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '44px',
            flexWrap: 'wrap',
          }}
        >
          <button
            style={{
              background: '#1A6B3A',
              color: '#fff',
              border: 'none',
              borderRadius: '9px',
              padding: '13px 26px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '-0.2px',
              boxShadow: '0 2px 12px rgba(26,107,58,0.25)',
            }}
          >
            Browse Tools →
          </button>

          <button
            style={{
              background: '#FFFFFF',
              color: '#1A6B3A',
              border: '1.5px solid #B8D9BF',
              borderRadius: '9px',
              padding: '13px 26px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            How it works ↓
          </button>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { num: '47', label: 'Tools' },
            { num: '0', label: 'Uploads' },
            { num: '100%', label: 'Private' },
            { num: 'Free', label: 'Forever' },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0A2415',
                    fontFamily: 'var(--font-bricolage)',
                  }}
                >
                  {stat.num}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#4A6B55',
                    fontWeight: 400,
                  }}
                >
                  {stat.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <span style={{ color: '#B8D9BF', fontSize: '16px' }}>·</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
