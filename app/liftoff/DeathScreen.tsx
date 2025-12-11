import React from 'react';

interface DeathScreenProps {
  reason: string;
  altitude: number;
  speed: number;
  onReset: () => void;
}

export function DeathScreen({ reason, altitude, speed, onReset }: DeathScreenProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="w-full max-w-2xl px-8 text-center">
        {/* Warning animation */}
        <div 
          className="text-8xl font-bold text-white mb-6 animate-pulse font-mono"
          style={{letterSpacing: '4px'}}
        >
          ⚠ MISSION FAILED ⚠
        </div>

        {/* Main death reason */}
        <div className="border-2 border-white p-8 bg-black mb-8">
          <p className="text-white font-mono text-xl mb-2">STRUCTURAL FAILURE</p>
          <p className="text-white font-mono text-lg">{reason}</p>
        </div>

        {/* Flight data at time of failure */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border border-white p-4 bg-black/50">
            <p className="text-white text-xs font-mono opacity-70">ALTITUDE AT FAILURE</p>
            <p className="text-white text-2xl font-mono font-bold">{(altitude * 0.1).toFixed(0)} km</p>
          </div>
          <div className="border border-white p-4 bg-black/50">
            <p className="text-white text-xs font-mono opacity-70">VELOCITY AT FAILURE</p>
            <p className="text-white text-2xl font-mono font-bold">{(speed / 1000).toFixed(2)} km/s</p>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="px-12 py-4 border-2 border-white bg-black text-white font-mono font-bold text-lg hover:bg-white hover:text-black transition-all tracking-widest"
        >
          MISSION RESET
        </button>
      </div>
    </div>
  );
}
