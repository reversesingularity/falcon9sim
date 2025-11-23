# Falcon 9 Booster Simulation Web Application

A comprehensive web-based visualization and simulation tool for the Falcon 9 Booster demonstrating Launch, Orbital Re-entry, and Successful Soft Landing.

![Falcon 9 Simulation](https://img.shields.io/badge/Falcon%209-Simulation-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Flask](https://img.shields.io/badge/Flask-2.0+-red)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-orange)

## 🚀 Features

### Real-Time 3D Visualization
- **Interactive 3D Scene**: Built with Three.js featuring:
  - Detailed Falcon 9 booster model with landing legs, grid fins, and 9 Merlin engines
  - Earth sphere with atmosphere and grid reference
  - Dynamic trajectory path visualization
  - Engine exhaust particle effects
  - Multiple camera views (Overview, Chase, Ground, Orbital)

### Physics-Based Simulation
- **Accurate Flight Dynamics**:
  - Gravity and thrust calculations
  - Atmospheric drag modeling
  - Fuel consumption based on ISP
  - 6-DOF attitude control
  - Eight distinct mission phases

### Mission Phases
1. **Pre-Launch**: Vehicle on launch pad
2. **Launch & Ascent**: Main engine burn and gravity turn
3. **Stage Separation**: Booster separates from second stage
4. **Boost-back Burn**: Reverse thrust to return to launch site
5. **Coast Phase**: Ballistic trajectory descent
6. **Re-entry Burn**: Atmospheric re-entry deceleration
7. **Aerodynamic Descent**: Grid fin control during descent
8. **Landing Burn**: Final deceleration and touchdown
9. **Touchdown**: Successful landing

### Comprehensive Telemetry
- **Real-Time Data Display**:
  - Mission elapsed time
  - Altitude and velocity
  - Vertical speed
  - Mass and fuel remaining
  - Thrust and throttle percentage
  - Attitude (pitch, roll, yaw)
  - G-force
  - Distance to target
  - Dynamic pressure

### Data Visualization
- **Interactive Charts**:
  - Altitude profile over time
  - Velocity profile over time
  - Fuel consumption over time
  - Real-time updates during simulation

### Interactive Controls
- Play/Pause simulation
- Reset to initial conditions
- Adjustable simulation speed (0.1x - 10x)
- Jump to specific mission phases
- Multiple camera perspectives
- Event log with timestamped mission events

## 📋 Prerequisites

- Python 3.8 or higher
- Modern web browser with WebGL support (Chrome, Firefox, Edge, Safari)
- Git (for cloning the repository)

## 🛠️ Installation

### 1. Clone the Repository

```powershell
cd f:\Projects-cmodi.000\Falcon9Sim
```

### 2. Create Virtual Environment (Recommended)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Python Dependencies

```powershell
pip install flask pandas numpy
```

### 4. Verify Directory Structure

Ensure your directory structure looks like this:

```
Falcon9Sim/
├── webapp/
│   ├── app.py
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── app.js
│   │       ├── simulation.js
│   │       ├── visualization.js
│   │       └── charts.js
│   └── templates/
│       └── index.html
├── aircraft/
│   └── Falcon9Booster/
│       ├── Falcon9Booster.xml
│       ├── Merlin1D.xml
│       └── ...
├── telemetry/
│   ├── falcon9_descent_telemetry.csv
│   └── falcon9_pitch_tuning_telemetry.csv
└── utils/
    └── parse_falcon9_data.py
```

## 🚀 Running the Application

### Start the Flask Server

```powershell
cd f:\Projects-cmodi.000\Falcon9Sim\webapp
python app.py
```

You should see output similar to:

```
============================================================
Falcon 9 Simulation Web Application
============================================================
Server starting...
Application will be available at: http://localhost:5000
Telemetry directory: f:\Projects-cmodi.000\Falcon9Sim\telemetry
Aircraft directory: f:\Projects-cmodi.000\Falcon9Sim\aircraft\Falcon9Booster
============================================================
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.x.x:5000
```

### Open in Browser

Navigate to: **http://localhost:5000**

## 🎮 Using the Application

### Basic Controls

1. **Start Simulation**: Click the "▶ Play" button
2. **Pause**: Click "⏸ Pause" during simulation
3. **Reset**: Click "↻ Reset" to return to initial state
4. **Adjust Speed**: Use the slider to change simulation speed (0.1x to 10x)
5. **Jump to Phase**: Select a phase from the dropdown to skip ahead
6. **Change Camera**: Click camera view buttons (Overview, Chase, Ground, Orbital)

### 3D Visualization Controls

- **Rotate View**: Left-click and drag
- **Pan View**: Right-click and drag (or Ctrl + left-click)
- **Zoom**: Mouse wheel or pinch gesture

### Reading Telemetry

The telemetry panel shows real-time data:
- **Green highlights**: Critical altitude and velocity data
- **Fuel bar**: Visual representation of remaining propellant
- **Events log**: Timestamped mission events
- **Phase indicator**: Current mission phase (top-left of 3D view)

### Interpreting Charts

- **Altitude Chart**: Shows height above ground over time
- **Velocity Chart**: Shows total velocity magnitude
- **Fuel Chart**: Shows percentage of fuel remaining

## 🔧 API Endpoints

The Flask backend provides several API endpoints:

- `GET /`: Main application page
- `GET /api/telemetry`: Retrieve CSV telemetry data
- `GET /api/booster-config`: Get Falcon 9 configuration from JSBSim XML
- `GET /api/mission-parameters`: Get simulation parameters
- `GET /api/simulation-status`: Get current simulation state
- `GET /health`: Health check endpoint

### Example API Usage

```javascript
// Fetch telemetry data
fetch('/api/telemetry')
    .then(response => response.json())
    .then(data => console.log(data));

// Get booster configuration
fetch('/api/booster-config')
    .then(response => response.json())
    .then(data => console.log(data));
```

## 🏗️ Architecture

### Frontend (Client-Side)

- **HTML5**: Structure and layout
- **CSS3**: Styling with dark theme and responsive design
- **Three.js**: 3D graphics rendering
- **Chart.js**: Data visualization
- **Vanilla JavaScript**: Application logic

### Backend (Server-Side)

- **Flask**: Web framework
- **Python**: Server-side logic
- **Pandas**: Data processing
- **JSBSim Integration**: Aircraft configuration parsing

### Simulation Engine

The simulation uses realistic physics:
- **Equations of Motion**: F = ma for translational dynamics
- **Thrust Model**: Based on throttle, ISP, and fuel flow
- **Atmospheric Model**: Exponential density decay with altitude
- **Drag Model**: Quadratic drag with coefficient 0.3
- **Mass Model**: Variable mass as fuel is consumed

## 📊 Technical Specifications

### Falcon 9 Block 5 Specifications (Used in Simulation)

| Parameter | Value |
|-----------|-------|
| Dry Mass | 25,400 kg (56,000 lbs) |
| Fuel Mass | 136,078 kg (RP-1) |
| Oxidizer Mass | 317,515 kg (LOX) |
| Total Mass | 478,993 kg |
| Maximum Thrust | 7,607 kN (9 engines) |
| Vacuum ISP | 311 seconds |
| Sea Level ISP | 282 seconds |
| Height | 40 meters (booster) |
| Diameter | 3.66 meters |
| Number of Engines | 9 (Merlin 1D) |
| Throttle Range | 40% - 100% |

## 🐛 Troubleshooting

### Common Issues

**Issue**: Server won't start
```
Solution: Ensure Flask is installed: pip install flask
```

**Issue**: 3D visualization not loading
```
Solution: Check browser console for errors. Ensure WebGL is supported.
Visit: https://get.webgl.org/
```

**Issue**: Telemetry data not showing
```
Solution: Verify telemetry CSV files exist in telemetry/ directory
Check console for API errors
```

**Issue**: Parse errors when loading booster config
```
Solution: Ensure parse_falcon9_data.py is in utils/ directory
Verify XML files exist in aircraft/Falcon9Booster/
```

## 🔮 Future Enhancements

- [ ] Integration with OpenMDAO/Dymos for trajectory optimization
- [ ] Real-time JSBSim coupling for higher fidelity simulation
- [ ] Multiplayer mode with multiple boosters
- [ ] Weather effects (wind, turbulence)
- [ ] Failure scenarios and emergency procedures
- [ ] VR/AR support
- [ ] Save/load simulation states
- [ ] Export telemetry data
- [ ] Advanced aerodynamics with grid fin control
- [ ] Heat shield visualization during re-entry

## 📚 Project Context

This web application is part of the larger Falcon 9 Booster Orbital Re-entry to Successful Soft Landing Simulation project. It provides an intuitive interface for visualizing trajectory optimization work done with:

- **JSBSim**: Flight dynamics simulation
- **OpenMDAO**: Multidisciplinary design optimization
- **Dymos**: Optimal control library for trajectory optimization
- **Python**: Simulation and data processing

The goal is to demonstrate feasibility of propulsive landing from orbital velocities, similar to SpaceX's operational Falcon 9 boosters.

## 📝 License

This project is part of an educational simulation and is not affiliated with SpaceX or NASA.

## 👨‍💻 Author

Created as part of the Falcon 9 Booster Simulation Project

## 🙏 Acknowledgments

- SpaceX for inspiration from their incredible Falcon 9 booster landings
- JSBSim community for the flight dynamics engine
- Three.js community for the 3D graphics library
- Chart.js for data visualization

---

**Ready to Launch? 🚀**

Start the server and watch your Falcon 9 booster complete a successful landing!

```powershell
python app.py
```

Then open: http://localhost:5000
