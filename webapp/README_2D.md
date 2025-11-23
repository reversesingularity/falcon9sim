# 🚀 Falcon 9 2D Simulation - Quick Start

## What's New?

This is a **completely rewritten 2D simulation** that replaces the buggy 3D version with:

- ✅ **Ultra-realistic 2D visuals** based on actual Falcon 9 reference images
- ✅ **Accurate physics** with proper thrust, gravity, and drag calculations
- ✅ **Stage separation** animation showing both stages
- ✅ **Correct landing orientation** with landing legs down
- ✅ **Dynamic camera** that follows the rocket and auto-zooms
- ✅ **Beautiful atmosphere** with gradient sky, stars, and clouds
- ✅ **Realistic exhaust plumes** with particle effects
- ✅ **Trajectory visualization** showing flight path
- ✅ **Full mission phases** from launch to landing

## How to Run

1. **Start the server** (if not already running):
   ```powershell
   cd "f:\Projects-cmodi.000\Falcon9Sim\webapp"
   python app.py
   ```

2. **Open your browser** to:
   - **2D Simulation (NEW)**: http://localhost:5000/
   - 3D Simulation (old): http://localhost:5000/3d

3. **Controls**:
   - **PLAY** button: Start/pause the simulation
   - **RESET** button: Reset to launchpad
   - **Speed slider**: Adjust simulation speed (0.1x to 5x)
   - Watch the rocket launch, separate stages, and land!

## Mission Phases

1. **PRE-LAUNCH** (3s) - Rocket on pad
2. **LAUNCH & ASCENT** (60s) - Full throttle vertical climb
3. **GRAVITY TURN** (90s) - Tilts 45° for optimal trajectory
4. **STAGE SEPARATION** (3s) - First and second stages separate
5. **BOOST-BACK BURN** (25s) - Booster flips and burns to return
6. **COAST PHASE** (120s) - Free fall back to Earth
7. **RE-ENTRY BURN** (15s) - Slows down through atmosphere
8. **AERODYNAMIC DESCENT** (40s) - Falls with air resistance
9. **LANDING BURN** (20s) - Final burn to slow down
10. **TOUCHDOWN** - Successful landing on legs!

## Features

### Visual Realism
- Accurate Falcon 9 proportions and details
- White body with black interstage band
- Grid fins at top
- 4 landing legs that deploy
- 9 Merlin engines (simplified to 3 visible)
- Stage 2 continues upward after separation

### Physics
- Realistic thrust-to-weight ratio
- Atmospheric drag based on altitude
- Fuel consumption based on ISP
- Gravity simulation
- Ground collision detection
- Velocity-based landing success check

### Camera System
- Auto-follows the rocket
- Dynamic zoom based on altitude:
  - 1.0x zoom: 0-5km
  - 0.5x zoom: 5-50km
  - 0.2x zoom: 50km+

### Telemetry
- Mission time (T+MM:SS)
- Altitude (km)
- Velocity (m/s)
- Vertical speed (m/s)
- Fuel remaining (%)
- Throttle (%)
- Current phase

## Why 2D is Better

The 2D simulation is:
- ✅ **More reliable** - No WebGL/Three.js complexity
- ✅ **Better performance** - Smooth 60 FPS on any device
- ✅ **Easier to understand** - Clear side view of entire mission
- ✅ **Accurate visuals** - Based on real Falcon 9 diagrams
- ✅ **No camera issues** - Perfect view of the entire trajectory

## Troubleshooting

**Rocket not moving?**
- Click the PLAY button (not just reset)
- Check that simulation speed isn't set too low

**Can't see the rocket?**
- It should be visible on the launch pad at start
- Try clicking RESET
- Camera auto-zooms out as rocket climbs

**Landing not working?**
- The rocket must be nearly vertical (within ~17°)
- Vertical speed must be < 5 m/s
- It takes 6+ minutes to complete the full mission

## Next Steps

Watch the complete mission profile:
1. Vertical launch with bright orange exhaust
2. Gradual tilt to 45° during gravity turn
3. Stage separation at ~120km altitude
4. Booster flip and boost-back burn
5. Long coast phase falling back
6. Re-entry burn through atmosphere
7. Final landing burn
8. Touchdown on landing legs!

The entire mission takes about **6-7 minutes** to complete.

Enjoy the show! 🚀
