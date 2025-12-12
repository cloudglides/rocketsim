import React from 'react';
import { OrbitView } from './OrbitView';

interface OrbitSuccessProps {
  altitude: number;
  speed: number;
  onReset: () => void;
  mission?: string;
}

export function OrbitSuccess({ altitude, speed, onReset, mission }: OrbitSuccessProps) {
  return (
    <div className="relative w-full h-screen">
      <OrbitView altitude={altitude} speed={speed} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div style={{
          border: '1px solid white',
          padding: '40px',
          textAlign: 'center',
          background: '#000000',
          fontFamily: "'Courier New', monospace"
        }}>
          <div style={{ fontSize: '24px', fontWeight: 400, marginBottom: '8px', letterSpacing: '2px' }}>
            MISSION COMPLETE
          </div>
          {mission && <div style={{ fontSize: '12px', marginBottom: '24px', letterSpacing: '1px', opacity: 0.6 }}>
            {mission}
          </div>}
          <div style={{ fontSize: '12px', lineHeight: '2', marginBottom: '32px', letterSpacing: '1px', opacity: 0.8 }}>
            ALTITUDE: {(altitude * 0.001).toFixed(0)} KM<br/>
            VELOCITY: {(speed / 1000).toFixed(2)} KM/S<br/>
          </div>
          <button
            onClick={onReset}
            style={{
              padding: '10px 24px',
              border: '1px solid white',
              background: '#000000',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.color = '#ffffff';
            }}
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}
