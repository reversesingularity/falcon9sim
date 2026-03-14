// constants.js - Falcon 9 Simulation Constants
const F9_CONSTANTS = {
    // Physics
    G_SEA_LEVEL: 9.80665,       // m/s²
    EARTH_RADIUS: 6371000,       // m
    SCALE_HEIGHT: 8500,          // m (atmosphere scale height)
    SEA_LEVEL_DENSITY: 1.225,    // kg/m³

    // Vehicle specs
    DRY_MASS: 25400,             // kg
    FUEL_MASS: 136078,           // kg RP-1
    OXIDIZER_MASS: 317515,       // kg LOX
    MAX_THRUST: 7607000,         // N (9 Merlins sea level)
    ISP_VACUUM: 311,             // seconds
    ISP_SEA_LEVEL: 282,          // seconds
    REF_AREA: 10.52,             // m² (cross-sectional)
    MIN_THROTTLE: 0.40,
    MAX_THROTTLE: 1.00,

    // Drag model (Mach-dependent)
    CD_SUBSONIC: 0.35,           // Mach < 0.8
    CD_TRANSONIC_PEAK: 0.80,     // Mach ~1.0
    CD_SUPERSONIC: 0.62,         // Mach > 3.0

    // Mission milestones
    MAX_Q_ALTITUDE: 14000,       // m (approx)
    STAGE_SEP_ALTITUDE: 70000,   // m (approx)

    // Performance limits
    MAX_TRAJECTORY_POINTS: 1000,
    MAX_PARTICLES: 500,
    MAX_CHART_POINTS: 200,
    CHART_UPDATE_INTERVAL: 6,    // frames (10 Hz at 60fps)
};

window.F9_CONSTANTS = F9_CONSTANTS;
