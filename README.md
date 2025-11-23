# 🚀 Falcon 9 Booster Simulation

A high-fidelity 2D physics simulation of SpaceX's Falcon 9 first stage booster, featuring realistic rocket dynamics, autonomous landing algorithms, and real-time telemetry visualization.

## 🌐 Live Demo

**[Launch the Simulation →](https://reversesingularity.github.io/falcon9sim/)**

Experience the complete Falcon 9 mission profile from liftoff to precision landing, all running in your browser with zero installation required.

## ✨ Key Features

### Realistic Physics Simulation
- **Newtonian mechanics** with gravity, drag, and thrust modeling
- **Mass dynamics** including propellant consumption and stage separation
- **Atmospheric effects** with altitude-dependent air density
- **Exhaust particle system** with realistic plume physics

### Autonomous Landing System
- **Suicide burn algorithm** for fuel-optimal descent
- **Dynamic throttle control** responding to altitude and velocity
- **Grid fin simulation** for atmospheric steering
- **Precision landing targeting** with real-time trajectory adjustment

### Mission Phases
The simulation accurately models all 10 phases of a Falcon 9 booster mission:

1. **Phase 0**: Liftoff and initial ascent
2. **Phase 1**: Powered ascent with full thrust
3. **Phase 2**: Continued ascent toward stage separation
4. **Phase 3**: MECO (Main Engine Cutoff) and stage separation
5. **Phase 4**: Boostback burn initiation
6. **Phase 5**: Atmospheric re-entry
7. **Phase 6**: Grid fin deployment and aerodynamic guidance
8. **Phase 7**: Entry burn to reduce velocity
9. **Phase 8**: Landing burn with precision throttle control
10. **Phase 9**: Touchdown and landing leg deployment

### Visual Features
- **10 phase-specific rocket sprites** showing mission progression
- **Chroma-keyed background images** for launchpad and landing pad
- **Dynamic camera system** with 4 zoom levels (1.0x, 0.7x, 0.4x, 0.2x)
- **Real-time exhaust effects** with particle-based plume rendering
- **Smooth animations** at 60 FPS

### Real-Time Telemetry
- **Altitude tracking** with live graphing
- **Velocity monitoring** (vertical and horizontal components)
- **Acceleration vectors** in real-time
- **Fuel consumption** and remaining propellant mass
- **Throttle percentage** display
- **Mission phase indicators**
- **Interactive charts** powered by Chart.js

## 🎮 Controls

- **LAUNCH**: Start the mission sequence
- **RESET**: Return to launchpad for another attempt
- **ZOOM**: Cycle through 4 camera zoom levels
- **PAUSE/RESUME**: Control simulation playback

## 🛠️ Technology Stack

- **Frontend**: HTML5 Canvas for rendering
- **Physics Engine**: Custom JavaScript implementation
- **Visualization**: Chart.js for telemetry graphs
- **Deployment**: GitHub Pages (static hosting)
- **Development**: Flask (local development server)

## 📊 Technical Specifications

- **Initial Mass**: ~25,600 kg (wet mass with propellant)
- **Dry Mass**: ~22,200 kg (empty booster)
- **Thrust**: Variable (0-100% throttle control)
- **Fuel**: RP-1/LOX (modeled as combined propellant)
- **Engine**: Merlin 1D cluster (9 engines)
- **Max Velocity**: ~2,000 m/s at MECO
- **Landing Accuracy**: <10 meters from target

## 🚀 Mission Profile

1. **Liftoff**: Full throttle ascent from Launch Complex 39A
2. **Ascent**: Powered flight to ~80 km altitude
3. **MECO**: Main engine cutoff and stage separation
4. **Boostback**: Flip maneuver and boostback burn
5. **Coast**: Ballistic trajectory through upper atmosphere
6. **Re-entry**: Grid fin deployment at ~70 km
7. **Entry Burn**: High-altitude deceleration burn
8. **Landing Burn**: Precision suicide burn for soft touchdown
9. **Landing**: Autonomous landing on drone ship or landing pad

## 🧪 Development

### Local Development
```bash
# Clone the repository
git clone https://github.com/reversesingularity/falcon9sim.git
cd falcon9sim

# Run local Flask server
cd webapp
python app.py

# Open browser to http://localhost:5000
```

### Project Structure
```
falcon9sim/
├── docs/                  # GitHub Pages deployment
│   ├── index.html        # Static HTML for web hosting
│   ├── js/               # JavaScript simulation engine
│   ├── css/              # Styling
│   └── images/           # Rocket sprites and backgrounds
├── webapp/               # Flask development version
│   ├── app.py           # Flask server
│   ├── templates/       # HTML templates
│   └── static/          # Static assets
├── scripts/             # Trajectory optimization scripts
│   ├── falcon9_trajectory_optimization.py
│   └── brachistochrone_dymos.py
└── aircraft/            # JSBSim flight dynamics models
    └── Falcon9Booster/  # Falcon 9 XML configuration
```

## 🔬 Physics & Algorithms

### Suicide Burn Algorithm
The simulation implements a fuel-optimal landing algorithm that calculates the precise moment to initiate the final landing burn:

```
landing_burn_start = sqrt(2 * altitude / (thrust/mass - g))
```

This ensures the rocket reaches zero velocity exactly at ground level, minimizing fuel consumption.

### Atmospheric Model
Air density decreases exponentially with altitude:
```
ρ(h) = ρ₀ * exp(-h / H)
```
where H = 8,500m (scale height)

### Drag Force
```
F_drag = 0.5 * ρ * v² * C_d * A
```

## 📈 Trajectory Optimization

The `scripts/` directory contains advanced trajectory optimization tools using:
- **OpenMDAO**: Multidisciplinary optimization framework
- **Dymos**: Dynamic optimization library
- **pyOptSparse**: Sparse optimization algorithms

These tools can generate optimal ascent and descent trajectories for the Falcon 9 booster.

## 🎯 Future Enhancements

- [ ] 3D visualization mode
- [ ] Multiple landing sites (OCISLY, JRTI, LZ-1, LZ-2)
- [ ] Weather conditions (wind, turbulence)
- [ ] Failure modes and emergency abort scenarios
- [ ] Replay system with saved missions
- [ ] Leaderboard for landing accuracy
- [ ] VR/AR support

## 📝 License

This project is open source and available for educational and demonstration purposes.

## 🙏 Acknowledgments

- SpaceX for inspiring this simulation
- The aerospace engineering community
- JSBSim flight dynamics engine
- NASA for trajectory optimization tools

## 📧 Contact

Created by [@reversesingularity](https://github.com/reversesingularity)

---

**Ready for liftoff?** [Try the simulation now!](https://reversesingularity.github.io/falcon9sim/)
