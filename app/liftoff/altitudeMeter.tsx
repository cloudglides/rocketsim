interface AltitudeMeterProps {
  altitude: number;
  maxAltitude?: number;
  inOrbit?: boolean;
}

export function AltitudeMeter({ altitude, maxAltitude = 300, inOrbit = false }: AltitudeMeterProps) {
  const percentage = Math.min(100, (altitude / maxAltitude) * 100);
  const needleRotation = (percentage / 100) * 180 - 90;

  return (
    <div className="altitude-meter-container">
      <style>{`
        @keyframes needle-sweep {
          from {
            transform: rotate(var(--from-rotation, -90deg));
          }
          to {
            transform: rotate(var(--to-rotation, 0deg));
          }
        }

        .altitude-meter-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(10, 10, 20, 0.8);
          border: 2px solid rgba(0, 255, 100, 0.5);
          border-radius: 12px;
          backdrop-filter: blur(8px);
          position: relative;
          box-shadow: 0 0 20px rgba(0, 255, 100, 0.2), inset 0 0 20px rgba(0, 255, 100, 0.05);
        }

        .altitude-meter-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 700;
          color: rgba(0, 255, 100, 0.9);
          margin-bottom: 4px;
        }

        .gauge-dial {
          position: relative;
          width: 180px;
          height: 100px;
          background: radial-gradient(ellipse at center, rgba(0, 20, 40, 0.9), rgba(0, 0, 10, 0.95));
          border: 3px solid rgba(0, 255, 100, 0.6);
          border-bottom: none;
          border-radius: 180px 180px 0 0;
          overflow: hidden;
          box-shadow: 
            inset 0 -4px 8px rgba(0, 0, 0, 0.8),
            inset 0 2px 4px rgba(0, 255, 100, 0.1),
            0 4px 12px rgba(0, 255, 100, 0.2);
        }

        .gauge-background {
          position: absolute;
          width: 100%;
          height: 100%;
          background: conic-gradient(
            from 180deg,
            rgba(255, 100, 0, 0.3) 0deg,
            rgba(255, 150, 0, 0.3) 30deg,
            rgba(0, 255, 100, 0.3) 60deg,
            rgba(0, 255, 100, 0.5) 90deg,
            rgba(0, 200, 255, 0.3) 120deg,
            rgba(255, 100, 0, 0.3) 180deg
          );
        }

        .gauge-markings {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .marking {
          position: absolute;
          width: 2px;
          height: 12px;
          background: rgba(0, 255, 100, 0.4);
          bottom: 0;
          transform-origin: bottom center;
        }

        .marking.major {
          height: 16px;
          width: 3px;
          background: rgba(0, 255, 100, 0.7);
        }

        .marking.text {
          position: absolute;
          bottom: -20px;
          font-size: 9px;
          color: rgba(0, 255, 100, 0.6);
          font-weight: 600;
          white-space: nowrap;
          transform: translateX(-50%);
        }

        .needle {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 4px;
          height: 70px;
          background: linear-gradient(to top, rgba(255, 100, 0, 0.9), rgba(255, 200, 0, 0.9));
          transform-origin: bottom center;
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(255, 100, 0, 0.8), 0 0 16px rgba(255, 100, 0, 0.4);
          animation: sweep 0.3s ease-out forwards;
        }

        @keyframes sweep {
          from {
            opacity: 0.7;
            box-shadow: 0 0 4px rgba(255, 100, 0, 0.4);
          }
          to {
            opacity: 1;
            box-shadow: 0 0 8px rgba(255, 100, 0, 0.8), 0 0 16px rgba(255, 100, 0, 0.4);
          }
        }

        .needle-center {
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 12px;
          height: 12px;
          background: radial-gradient(circle, rgba(255, 200, 0, 0.9), rgba(255, 100, 0, 0.8));
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 
            0 0 12px rgba(255, 100, 0, 0.9),
            inset 0 -2px 4px rgba(0, 0, 0, 0.5),
            inset 0 2px 4px rgba(255, 255, 255, 0.3);
          z-index: 10;
        }

        .gauge-value {
          font-size: 24px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          color: rgba(0, 255, 100, 0.9);
          text-shadow: 0 0 8px rgba(0, 255, 100, 0.5);
          margin-top: 8px;
        }

        .in-orbit {
          color: rgba(0, 255, 100, 1);
          text-shadow: 0 0 12px rgba(0, 255, 100, 0.8);
          animation: orbit-pulse 1s ease-in-out infinite;
        }

        @keyframes orbit-pulse {
          0%, 100% {
            text-shadow: 0 0 8px rgba(0, 255, 100, 0.5);
          }
          50% {
            text-shadow: 0 0 16px rgba(0, 255, 100, 1);
          }
        }
      `}</style>

      <div className="altitude-meter-label">Altitude Gauge</div>

      <div className="gauge-dial">
        <div className="gauge-background" />
        <div className="gauge-markings">
          {/* Generate markings from 0 to 180 degrees */}
          {Array.from({ length: 19 }).map((_, i) => {
            const angle = i * 10;
            const isMajor = i % 2 === 0;
            const isLabel = i % 4 === 0;
            const label = isMajor ? `${i * 15}` : null;

            return (
              <div
                key={i}
                className={`marking ${isMajor ? 'major' : ''}`}
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                {isLabel && (
                  <div className="marking text" style={{ transform: `rotate(${-angle}deg) translateX(-50%)` }}>
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="needle"
          style={{
            transform: `translateX(-50%) rotate(${needleRotation}deg)`,
          }}
        />
        <div className="needle-center" />
      </div>

      <div className={`gauge-value ${inOrbit ? 'in-orbit' : ''}`}>
        {altitude.toFixed(1)} km
      </div>
    </div>
  );
}
