import React from 'react';

interface FlightDataProps {
  altitude: number;
  speed: number;
  fuelPercent: number;
  gForce: number;
  machNumber: number;
  fuelBurnRate: number;
  atmosphericDensity: number;
  apogee: number | null;
  perigee: number | null;
}

export function FlightData({
  altitude,
  speed,
  fuelPercent,
  gForce,
  machNumber,
  fuelBurnRate,
  atmosphericDensity,
  apogee,
  perigee,
}: FlightDataProps) {
  // Color based on conditions
  const getGForceColor = () => {
    if (gForce > 6) return '#ff0000';
    if (gForce > 4) return '#ffff00';
    return '#ffffff';
  };

  const getMachColor = () => {
    if (machNumber > 25) return '#ff0000';
    if (machNumber > 15) return '#ffff00';
    if (machNumber > 5) return '#ffffff';
    return '#ffffff';
  };

  const getAtmosphereVisibility = () => {
    // Atmosphere effectively ends at 100km, so use that as reference
    const normalizedAlt = Math.max(0, Math.min(100, altitude)) / 100;
    return 1 - normalizedAlt;
  };

  return (
    <>
      {/* Top left - Speed & Velocity Data */}
      <div className="absolute top-20 left-20 font-mono text-white text-xs space-y-2 pointer-events-none z-40">
        <div className="border-l-2 border-white pl-2">
          <div className="text-9px">VELOCITY</div>
          <div className="text-sm font-bold">{(speed / 1000).toFixed(2)} km/s</div>
          <div className="text-9px opacity-70">MACH {machNumber.toFixed(1)}</div>
        </div>

        <div className="border-l-2 border-white pl-2 mt-4">
          <div className="text-9px">G-FORCE</div>
          <div className="text-sm font-bold" style={{color: getGForceColor()}}>
            {gForce.toFixed(2)}G
          </div>
        </div>

        <div className="border-l-2 border-white pl-2 mt-4">
          <div className="text-9px">ATMOSPHERE</div>
          <div className="h-6 w-16 border border-white relative bg-black">
            <div 
              className="absolute bottom-0 left-0 w-full bg-white transition-all duration-100"
              style={{height: `${getAtmosphereVisibility() * 100}%`}}
            />
          </div>
          <div className="text-9px opacity-70">DENSITY {(atmosphericDensity * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Top right - Fuel Data */}
      <div className="absolute top-20 right-20 font-mono text-white text-xs space-y-2 pointer-events-none z-40 text-right">
        <div className="border-r-2 border-white pr-2">
          <div className="text-9px">FUEL</div>
          <div className="text-sm font-bold">{fuelPercent.toFixed(1)}%</div>
          <div className="text-9px opacity-70">BURN {fuelBurnRate.toFixed(3)}/s</div>
        </div>

        {/* Orbital Data when available */}
        {(apogee !== null || perigee !== null) && (
          <div className="border-r-2 border-white pr-2 mt-4">
            <div className="text-9px">ORBITAL</div>
            {apogee !== null && (
              <div className="text-9px">AP {apogee.toFixed(0)} km</div>
            )}
            {perigee !== null && (
              <div className="text-9px">PE {perigee.toFixed(0)} km</div>
            )}
          </div>
        )}
      </div>

      {/* Altitude visual bar (left side, middle) */}
      <div className="absolute left-20 top-1/2 -translate-y-1/2 font-mono text-white text-xs space-y-1 pointer-events-none z-40">
        <div className="text-9px">ALTITUDE</div>
        <div className="w-2 h-40 border border-white bg-black relative">
          <div 
            className="absolute bottom-0 left-0 w-full bg-white transition-all duration-100"
            style={{height: `${Math.min(100, (altitude * 0.1) / 10)}%`}}
          />
        </div>
        <div className="text-sm font-bold">{(altitude * 0.1).toFixed(0)} km</div>
      </div>
    </>
  );
}
