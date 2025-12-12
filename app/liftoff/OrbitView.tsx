import React, { useEffect, useRef, useState } from 'react';

interface OrbitViewProps {
  altitude: number;
  speed: number;
}

export function OrbitView({ altitude, speed }: OrbitViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeScale, setTimeScale] = useState(1);
  const [showSolar, setShowSolar] = useState(false);
  const stateRef = useRef({ elapsed: 0, animId: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      stateRef.current.elapsed += deltaTime;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (showSolar) {
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.fill();

        const pData = [
          { d: 150, s: 12, c: '#555555', sp: 0.04 },
          { d: 280, s: 15, c: '#777777', sp: 0.015 },
          { d: 410, s: 18, c: '#444444', sp: 0.01 },
          { d: 540, s: 10, c: '#666666', sp: 0.008 },
        ];

        pData.forEach(p => {
          const ang = stateRef.current.elapsed * p.sp * timeScale;
          const px = cx + Math.cos(ang) * p.d;
          const py = cy + Math.sin(ang) * p.d;

          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, p.d, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(px, py, p.s, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.fill();

        const orbitR = 240;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
        ctx.stroke();

        const G = 6.674e-11;
        const M = 5.972e24;
        const R = 6.371e6;
        const alt = altitude * 1000;
        const r = R + alt;
        const v = Math.sqrt((G * M) / r);
        const T = (2 * Math.PI * r) / v;
        const w = (2 * Math.PI) / T;

        const ang = stateRef.current.elapsed * w * timeScale;
        const rx = cx + Math.cos(ang) * orbitR;
        const ry = cy + Math.sin(ang) * orbitR;

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(ang + Math.PI / 2);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-9, -12);
        ctx.lineTo(9, -12);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      stateRef.current.animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(stateRef.current.animId);
    };
  }, [showSolar, timeScale, altitude]);

  return (
    <div className="fixed inset-0 bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ display: 'block' }}
      />

      <div className="absolute top-20 left-20 z-50 font-mono text-white text-xs border border-white p-4">
        <div style={{ letterSpacing: '1px', lineHeight: '1.6' }}>
          <div>ALTITUDE: {(altitude * 0.001).toFixed(0)} KM</div>
          <div>VELOCITY: {(speed / 1000).toFixed(2)} KM/S</div>
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid white' }}>
            {showSolar ? 'SOLAR VIEW' : 'ORBITAL VIEW'}
          </div>
        </div>
      </div>

      <div className="absolute bottom-20 right-20 flex flex-col gap-4 z-50">
        <button
          onClick={() => setShowSolar(!showSolar)}
          className="px-4 py-2 border border-white text-white font-mono text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          style={{ letterSpacing: '1px' }}
        >
          {showSolar ? 'BACK' : 'WARP'}
        </button>
        <div className="flex gap-2">
          {[1, 2, 10, 100].map(scale => (
            <button
              key={scale}
              onClick={() => setTimeScale(scale)}
              className={`px-3 py-2 font-mono text-xs uppercase transition-all ${
                timeScale === scale 
                  ? 'border border-white bg-white text-black' 
                  : 'border border-white text-white hover:bg-white hover:text-black'
              }`}
              style={{ letterSpacing: '1px' }}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
