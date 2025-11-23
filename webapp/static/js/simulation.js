// simulation.js - Falcon 9 Simulation Physics Engine (KSP-Style)

class Falcon9Simulation {
    constructor() {
        // Physical constants
        this.G = 9.80665; // m/s^2
        this.EARTH_RADIUS = 6371000; // meters
        
        // Falcon 9 specifications (from JSBSim XML)
        this.dryMass = 25400; // kg (56000 lbs)
        this.fuelMass = 136078; // kg (RP-1)
        this.oxidizerMass = 317515; // kg (LOX)
        this.maxThrust = 7607000; // N (1,710,000 lbs * 9 engines at sea level)
        this.isp = 311; // seconds (vacuum)
        this.minThrottle = 0.4;
        this.maxThrottle = 1.0;
        
        // State variables (KSP coordinate system: Y is up)
        this.time = 0;
        this.position = { x: 0, y: 20, z: 0 }; // Start with center at 20m (rocket is 40m tall)
        this.velocity = { x: 0, y: 0, z: 0 }; // m/s
        this.rotation = { pitch: 0, roll: 0, yaw: 0 }; // radians - 0 is vertical up
        this.angularVelocity = { pitch: 0, roll: 0, yaw: 0 };
        this.targetRotation = { pitch: 0, roll: 0, yaw: 0 };
        this.mass = this.dryMass + this.fuelMass + this.oxidizerMass;
        this.fuelRemaining = this.fuelMass + this.oxidizerMass;
        this.throttle = 0;
        this.currentPhase = 0;
        
        // Trajectory data
        this.trajectoryPoints = [];
        this.maxTrajectoryPoints = 1000;
        
        // Mission phases (KSP-style with realistic durations)
        this.phases = [
            { name: 'Pre-Launch', duration: 3, throttle: 0, targetPitch: 0 },
            { name: 'Launch & Ascent', duration: 60, throttle: 1.0, targetPitch: 0 },
            { name: 'Gravity Turn', duration: 90, throttle: 0.85, targetPitch: 45 },
            { name: 'Stage Separation', duration: 3, throttle: 0, targetPitch: 45 },
            { name: 'Boost-back Burn', duration: 25, throttle: 0.7, targetPitch: 135 },
            { name: 'Coast Phase', duration: 120, throttle: 0, targetPitch: 180 },
            { name: 'Re-entry Burn', duration: 15, throttle: 0.5, targetPitch: 180 },
            { name: 'Aerodynamic Descent', duration: 40, throttle: 0, targetPitch: 180 },
            { name: 'Landing Burn', duration: 20, throttle: 0.85, targetPitch: 180 },
            { name: 'Touchdown', duration: 0, throttle: 0, targetPitch: 180 }
        ];
        
        this.phaseStartTime = 0;
        this.isRunning = false;
        this.simulationSpeed = 1.0;
        this.downrangeDistance = 0;
    }

    reset() {
        this.time = 0;
        this.position = { x: 0, y: 20, z: 0 }; // Center of rocket at 20m
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { pitch: 0, roll: 0, yaw: 0 };
        this.targetRotation = { pitch: 0, roll: 0, yaw: 0 };
        this.angularVelocity = { pitch: 0, roll: 0, yaw: 0 };
        this.mass = this.dryMass + this.fuelMass + this.oxidizerMass;
        this.fuelRemaining = this.fuelMass + this.oxidizerMass;
        this.throttle = 0;
        this.currentPhase = 0;
        this.phaseStartTime = 0;
        this.trajectoryPoints = [];
        this.isRunning = false;
        this.downrangeDistance = 0;
    }

    start() {
        this.isRunning = true;
    }

    pause() {
        this.isRunning = false;
    }

    setSimulationSpeed(speed) {
        this.simulationSpeed = Math.max(0.1, Math.min(10, speed));
    }

    jumpToPhase(phaseIndex) {
        if (phaseIndex >= 0 && phaseIndex < this.phases.length) {
            // Calculate total time up to this phase
            let totalTime = 0;
            for (let i = 0; i < phaseIndex; i++) {
                totalTime += this.phases[i].duration;
            }
            
            this.time = totalTime;
            this.currentPhase = phaseIndex;
            this.phaseStartTime = totalTime;
            
            // Set approximate state for this phase
            this.setPhaseState(phaseIndex);
        }
    }

    setPhaseState(phaseIndex) {
        // Set realistic state based on phase (KSP-style)
        const fuelUsed = phaseIndex * 0.15; // Progressive fuel consumption
        this.fuelRemaining = (this.fuelMass + this.oxidizerMass) * (1 - fuelUsed);
        this.mass = this.dryMass + this.fuelRemaining;
        
        switch(phaseIndex) {
            case 0: // Pre-Launch
                this.position = { x: 0, y: 20, z: 0 }; // Center of rocket at 20m (half of 40m height)
                this.velocity = { x: 0, y: 0, z: 0 };
                this.rotation = { pitch: 0, roll: 0, yaw: 0 };
                this.downrangeDistance = 0;
                break;
            case 1: // Launch & Ascent
                this.position = { x: 0, y: 15000, z: 0 };
                this.velocity = { x: 0, y: 1200, z: 0 };
                this.rotation = { pitch: 0, roll: 0, yaw: 0 };
                this.downrangeDistance = 0;
                break;
            case 2: // Gravity Turn
                this.position = { x: 25000, y: 80000, z: 0 };
                this.velocity = { x: 2000, y: 800, z: 0 };
                this.rotation = { pitch: 45 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 25000;
                break;
            case 3: // Stage Separation
                this.position = { x: 80000, y: 120000, z: 0 };
                this.velocity = { x: 2500, y: 200, z: 0 };
                this.rotation = { pitch: 45 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 80000;
                break;
            case 4: // Boost-back Burn
                this.position = { x: 150000, y: 100000, z: 0 };
                this.velocity = { x: -800, y: -400, z: 0 };
                this.rotation = { pitch: 135 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 150000;
                break;
            case 5: // Coast Phase
                this.position = { x: 80000, y: 60000, z: 0 };
                this.velocity = { x: -600, y: -1200, z: 0 };
                this.rotation = { pitch: 180 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 80000;
                break;
            case 6: // Re-entry Burn
                this.position = { x: 30000, y: 35000, z: 0 };
                this.velocity = { x: -200, y: -900, z: 0 };
                this.rotation = { pitch: 180 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 30000;
                break;
            case 7: // Aerodynamic Descent
                this.position = { x: 10000, y: 10000, z: 0 };
                this.velocity = { x: -50, y: -350, z: 0 };
                this.rotation = { pitch: 180 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 10000;
                break;
            case 8: // Landing Burn
                this.position = { x: 1000, y: 2000, z: 0 };
                this.velocity = { x: 0, y: -80, z: 0 };
                this.rotation = { pitch: 180 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 1000;
                break;
            case 9: // Touchdown
                this.position = { x: 200, y: 40, z: 0 };
                this.velocity = { x: 0, y: 0, z: 0 };
                this.rotation = { pitch: 180 * Math.PI / 180, roll: 0, yaw: 0 };
                this.downrangeDistance = 200;
                break;
        }
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        const dt = Math.min(deltaTime * this.simulationSpeed, 0.1); // Cap dt for stability
        this.time += dt;

        // Update current phase
        this.updatePhase();

        // Calculate forces
        const forces = this.calculateForces();
        
        // Update velocity (F = ma)
        const acceleration = {
            x: forces.x / this.mass,
            y: forces.y / this.mass,
            z: forces.z / this.mass
        };

        this.velocity.x += acceleration.x * dt;
        this.velocity.y += acceleration.y * dt;
        this.velocity.z += acceleration.z * dt;

        // Update position
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        // Ground collision with proper landing
        if (this.position.y < 40) {
            this.position.y = 40;
            if (this.currentPhase >= 8) {
                this.velocity.x = 0;
                this.velocity.y = 0;
                this.velocity.z = 0;
                this.position.x = 0;
                this.position.z = 0;
                this.rotation.pitch = Math.PI; // Point straight up after landing
                this.isRunning = false;
            } else {
                // Bounce if not landing phase
                this.velocity.y = Math.abs(this.velocity.y) * 0.3;
            }
        }

        // Update rotation based on flight phase (smooth transitions)
        this.updateRotation(dt);

        // Update mass (fuel consumption)
        if (this.throttle > 0 && this.fuelRemaining > 0) {
            const fuelFlow = (this.maxThrust * this.throttle) / (this.isp * this.G);
            const fuelBurned = fuelFlow * dt;
            this.fuelRemaining = Math.max(0, this.fuelRemaining - fuelBurned);
            this.mass = this.dryMass + this.fuelRemaining;
        }

        // Track downrange distance
        this.downrangeDistance = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);

        // Store trajectory point
        if (this.trajectoryPoints.length < this.maxTrajectoryPoints) {
            this.trajectoryPoints.push({
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            });
        } else {
            this.trajectoryPoints.shift();
            this.trajectoryPoints.push({
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            });
        }
    }

    updatePhase() {
        const phase = this.phases[this.currentPhase];
        const phaseTime = this.time - this.phaseStartTime;

        if (phaseTime >= phase.duration && this.currentPhase < this.phases.length - 1) {
            this.currentPhase++;
            this.phaseStartTime = this.time;
        }

        // Set throttle based on current phase
        this.throttle = this.phases[this.currentPhase].throttle;
    }

    calculateForces() {
        const forces = { x: 0, y: 0, z: 0 };

        // Gravity (always down)
        forces.y -= this.mass * this.G;

        // Thrust (direction based on rotation - 0 pitch is straight up)
        if (this.throttle > 0 && this.fuelRemaining > 0) {
            const thrust = this.maxThrust * this.throttle;
            
            // In KSP-style: 0° pitch = straight up (along +Y axis)
            // Pitch rotates in XY plane
            const thrustX = thrust * Math.sin(this.rotation.pitch);
            const thrustY = thrust * Math.cos(this.rotation.pitch);
            const thrustZ = 0; // Simplified - no yaw for now

            forces.x += thrustX;
            forces.y += thrustY;
            forces.z += thrustZ;
        }

        // Simplified drag (proportional to velocity squared)
        const altitude = Math.max(0, this.position.y - 40); // Altitude above ground
        const density = this.getAirDensity(altitude);
        const velocityMag = Math.sqrt(
            this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
        );

        if (velocityMag > 0.1) {
            const dragCoeff = 0.35;
            const referenceArea = 10.52; // m^2 (cross-sectional area)
            const dragMag = 0.5 * density * velocityMag ** 2 * dragCoeff * referenceArea;

            forces.x -= (this.velocity.x / velocityMag) * dragMag;
            forces.y -= (this.velocity.y / velocityMag) * dragMag;
            forces.z -= (this.velocity.z / velocityMag) * dragMag;
        }

        return forces;
    }

    getAirDensity(altitude) {
        // Simplified atmospheric model
        const seaLevelDensity = 1.225; // kg/m^3
        const scaleHeight = 8500; // meters
        return seaLevelDensity * Math.exp(-altitude / scaleHeight);
    }

    updateRotation(dt) {
        // KSP-style smooth rotation based on phase
        const phase = this.phases[this.currentPhase];
        const targetPitch = (phase.targetPitch || 0) * Math.PI / 180;
        
        // Smooth rotation towards target
        const rotationSpeed = 0.8; // radians per second
        const pitchDiff = targetPitch - this.rotation.pitch;
        
        if (Math.abs(pitchDiff) > 0.01) {
            const pitchChange = Math.sign(pitchDiff) * Math.min(Math.abs(pitchDiff), rotationSpeed * dt);
            this.rotation.pitch += pitchChange;
        } else {
            this.rotation.pitch = targetPitch;
        }
        
        // Keep rotation bounded
        this.rotation.pitch = Math.max(-Math.PI, Math.min(Math.PI, this.rotation.pitch));
        
        // Gradual roll dampening
        this.rotation.roll *= 0.98;
        
        // For landing phase, align to vertical
        if (this.currentPhase >= 8 && this.position.y < 500) {
            const verticalTarget = Math.PI; // 180° = engines down, nose up
            const tiltDiff = verticalTarget - this.rotation.pitch;
            this.rotation.pitch += tiltDiff * 0.1 * dt;
        }
    }

    getTelemetry() {
        const velocityMag = Math.sqrt(
            this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2
        );

        const fuelPercent = (this.fuelRemaining / (this.fuelMass + this.oxidizerMass)) * 100;

        const gForce = Math.sqrt(
            (this.velocity.x / this.G) ** 2 +
            (this.velocity.y / this.G) ** 2 +
            (this.velocity.z / this.G) ** 2
        );

        const distanceToTarget = Math.sqrt(
            this.position.x ** 2 + this.position.z ** 2
        );

        const density = this.getAirDensity(this.position.y);
        const dynPressure = 0.5 * density * velocityMag ** 2;

        return {
            time: this.time,
            altitude: this.position.y,
            velocity: velocityMag,
            verticalSpeed: this.velocity.y,
            mass: this.mass,
            fuel: fuelPercent,
            thrust: this.maxThrust * this.throttle / 1000, // kN
            throttle: this.throttle * 100,
            pitch: this.rotation.pitch * (180 / Math.PI),
            roll: this.rotation.roll * (180 / Math.PI),
            yaw: this.rotation.yaw * (180 / Math.PI),
            gforce: gForce,
            distance: distanceToTarget,
            dynPressure: dynPressure / 1000, // kPa
            phase: this.phases[this.currentPhase].name,
            position: this.position,
            rotation: this.rotation
        };
    }

    getCurrentPhase() {
        return this.phases[this.currentPhase].name;
    }
}

// Export for use in app.js
window.Falcon9Simulation = Falcon9Simulation;
