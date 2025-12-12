# Game Updates Summary

## Visual Changes
- **Restored warm aesthetics**: Brown ground (0x8b4513) and blue sky (0x87ceeb)
- **Orange rocket exhaust**: Flame particles with orange-to-red color gradient
- **Increased particle density**: More visible thrust effects (3000 flames, 1200 smoke)

## Difficulty Increases
- **Higher gravity**: 0.0022 (from 0.0018)
- **Reduced thrust**: 0.012 (from 0.015)  
- **Lower max speed**: 8.5 km/s (from 11.2 km/s)
- **Higher fuel consumption**: 0.35 (from 0.25)
- **Increased rocket mass**: 1200 kg (from 900 kg)
- **More drag**: 0.00012 (from 0.00008)

## New Interactive Controls
- **W/S keys**: Pitch control - adjust rocket nose up/down
- **A/D keys**: Roll control - spin rocket left/right
- **Real-time feedback**:
  - Wind indicator (top-right): Shows current wind force
  - Tilt indicator (bottom): Displays current pitch/roll angles
  - Dynamic wind: Oscillates with time, requires active management

## Mission System Overhaul
1. **Suborbital** (150 km)
   - No wind challenges
   - Difficulty: 1
   - Fuel: 280
   
2. **Staging** (400 km)
   - Crosswinds increase fuel consumption
   - Difficulty: 2
   - Fuel: 320
   - Wind force: 0.0012

3. **Orbital** (1000 km) - EXTREME
   - Severe wind conditions
   - Higher gravity
   - Difficulty: 3
   - Fuel: 300
   - Wind force: 0.0015
   - Increased drag

## Gameplay Mechanics
- **Wind affects trajectory**: Constant lateral force that changes with time
- **Tilt affects thrust direction**: Control your trajectory by angling the rocket
- **Fuel is limited**: Higher consumption rate requires skill
- **Gravity scales with altitude**: Weaker at higher altitudes, stronger near ground
- **Atmospheric drag**: Severe near ground, less in space

## User Interaction Improvements
- Active steering required (not just hold space)
- Must compensate for wind using pitch/roll
- Visual feedback shows current flight conditions
- Difficulty scaling per mission affects physics
