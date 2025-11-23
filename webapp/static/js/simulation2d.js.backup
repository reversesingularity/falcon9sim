// Falcon 9 2D Simulation - Ultra Realistic Visual Simulation
console.log('Simulation2D script loaded');

class Falcon9Simulation2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Physics constants
        this.G = 9.80665; // m/s²
        
        // Rocket specifications
        this.dryMass = 25400; // kg
        this.fuelMass = 453593; // kg (RP-1 + LOX)
        this.maxThrust = 7607000; // N
        this.isp = 311; // seconds
        
        // Simulation state
        this.time = 0;
        this.isRunning = false;
        this.simulationSpeed = 1.0;
        
        // Stage 1 (Booster) state
        this.stage1 = {
            active: true,
            position: { x: 100, y: 100 }, // Start 100m above ground
            velocity: { x: 0, y: 0 }, // m/s
            mass: this.dryMass + this.fuelMass,
            fuel: this.fuelMass,
            angle: 0, // radians (0 = vertical up)
            throttle: 0
        };
        
        // Stage 2 (for separation visual)
        this.stage2 = {
            active: false,
            position: { x: 100, y: 100 },
            velocity: { x: 0, y: 0 },
            visible: false
        };
        
        // Mission phases
        this.phases = [
            { name: 'PRE-LAUNCH', duration: 3, throttle: 0, targetAngle: 0 },
            { name: 'LAUNCH & ASCENT', duration: 60, throttle: 1.0, targetAngle: 0 },
            { name: 'GRAVITY TURN', duration: 90, throttle: 0.85, targetAngle: Math.PI / 6 }, // 30 degrees tilt
            { name: 'STAGE SEPARATION', duration: 3, throttle: 0, targetAngle: Math.PI / 6 },
            { name: 'BOOST-BACK BURN', duration: 25, throttle: 0.7, targetAngle: -Math.PI / 3 }, // -60 degrees (tilted back, engines toward launch site)
            { name: 'COAST PHASE', duration: 120, throttle: 0, targetAngle: -Math.PI / 6 }, // -30 degrees (slightly tilted while falling)
            { name: 'RE-ENTRY BURN', duration: 15, throttle: 0.5, targetAngle: 0 }, // 0 degrees (vertical, engines down)
            { name: 'AERODYNAMIC DESCENT', duration: 40, throttle: 0, targetAngle: 0 }, // 0 degrees (vertical, engines down)
            { name: 'LANDING BURN', duration: 25, throttle: 0.95, targetAngle: 0 }, // 0 degrees (vertical, engines down)
            { name: 'TOUCHDOWN', duration: 0, throttle: 0, targetAngle: 0 }, // 0 degrees (landed on pad)
            { name: 'LANDED', duration: 0, throttle: 0, targetAngle: 0 } // Phase 10: Booster secured on pad
        ];
        
        this.currentPhase = 0;
        this.phaseStartTime = 0;
        
        // Visual effects
        this.exhaustParticles = [];
        this.trajectory = [];
        this.stars = this.generateStars(200);
        this.clouds = this.generateClouds(15);
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1.0,
            targetZoom: 1.0
        };
        
        // Events
        this.events = [];
        
        // Telemetry update counter
        this.telemetryFrameCount = 0;
        
        // Load sprite images
        this.sprites = {
            full: new Image(),
            stage1: new Image(),
            stage2: new Image(),
            launchpad: new Image(),
            landingpad: new Image(),
            // Phase-specific Falcon 9 rocket sprites
            rocket_phase0: new Image(), // Pre-launch
            rocket_phase1: new Image(), // Launch
            rocket_phase2: new Image(), // Gravity turn
            rocket_phase3: new Image(), // Separation
            rocket_phase4: new Image(), // Boostback
            rocket_phase5: new Image(), // Coast
            rocket_phase6: new Image(), // Re-entry
            rocket_phase7: new Image(), // Descent
            rocket_phase8: new Image(), // Landing
            rocket_phase9: new Image(), // Landed
            loaded: false,
            backgroundsLoaded: false,
            phaseRocketsLoaded: false
        };
        
        this.sprites.full.src = '/static/images/falcon9_full.png';
        this.sprites.stage1.src = '/static/images/falcon9_stage1.png';
        this.sprites.stage2.src = '/static/images/falcon9_stage2.png';
        this.sprites.launchpad.src = '/static/images/launchpad.jpg';
        this.sprites.landingpad.src = '/static/images/landingpad.jpg';
        
        // Phase-specific rocket sprites
        this.sprites.rocket_phase0.src = '/static/images/falcon9_phase0.png';
        this.sprites.rocket_phase1.src = '/static/images/falcon9_phase1.png';
        this.sprites.rocket_phase2.src = '/static/images/falcon9_phase2.png';
        this.sprites.rocket_phase3.src = '/static/images/falcon9_phase3.png';
        this.sprites.rocket_phase4.src = '/static/images/falcon9_phase4.png';
        this.sprites.rocket_phase5.src = '/static/images/falcon9_phase5.png';
        this.sprites.rocket_phase6.src = '/static/images/falcon9_phase6.png';
        this.sprites.rocket_phase7.src = '/static/images/falcon9_phase7.png';
        this.sprites.rocket_phase8.src = '/static/images/falcon9_phase8.png';
        this.sprites.rocket_phase9.src = '/static/images/falcon9_phase9.png';
        
        // Wait for all images to load
        let loadedCount = 0;
        let backgroundCount = 0;
        let phaseRocketCount = 0;
        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === 3) {
                this.sprites.loaded = true;
                console.log('All sprites loaded');
            }
        };
        
        const checkBackgroundLoaded = () => {
            backgroundCount++;
            if (backgroundCount === 2) {
                this.sprites.backgroundsLoaded = true;
                console.log('Background images loaded');
            }
        };
        
        const checkPhaseRocketLoaded = () => {
            phaseRocketCount++;
            if (phaseRocketCount === 10) {
                this.sprites.phaseRocketsLoaded = true;
                console.log('Phase-specific rocket sprites loaded');
            }
        };
        
        this.sprites.full.onload = checkAllLoaded;
        this.sprites.stage1.onload = checkAllLoaded;
        this.sprites.stage2.onload = checkAllLoaded;
        this.sprites.launchpad.onload = checkBackgroundLoaded;
        this.sprites.landingpad.onload = checkBackgroundLoaded;
        
        // Phase-specific rocket sprites
        this.sprites.rocket_phase0.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase1.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase2.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase3.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase4.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase5.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase6.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase7.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase8.onload = checkPhaseRocketLoaded;
        this.sprites.rocket_phase9.onload = checkPhaseRocketLoaded;
        
        this.sprites.full.onerror = () => console.error('Failed to load falcon9_full.png');
        this.sprites.stage1.onerror = () => console.error('Failed to load falcon9_stage1.png');
        this.sprites.stage2.onerror = () => console.error('Failed to load falcon9_stage2.png');
        this.sprites.launchpad.onerror = () => console.warn('Failed to load launchpad.jpg - using default background');
        this.sprites.landingpad.onerror = () => console.warn('Failed to load landingpad.jpg - using default background');
        
        // Phase rocket error handlers
        for (let i = 0; i <= 9; i++) {
            this.sprites[`rocket_phase${i}`].onerror = () => console.warn(`Failed to load falcon9_phase${i}.png - using default rocket sprite`);
        }
        
        // Initialize trajectory data arrays for graphs
        this.trajectoryData = {
            time: [],
            altitude: [],
            velocity: [],
            maxPoints: 100 // Keep last 100 data points
        };
        
        // Initialize charts (will be set up after DOM loads)
        this.charts = {
            altitude: null,
            velocity: null
        };
    }
    
    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * 10000 - 5000,
                y: Math.random() * 100000 + 50000,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        return stars;
    }
    
    generateClouds(count) {
        const clouds = [];
        for (let i = 0; i < count; i++) {
            clouds.push({
                x: Math.random() * 5000 - 2500,
                y: Math.random() * 15000 + 5000,
                width: Math.random() * 800 + 400,
                height: Math.random() * 200 + 100,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
        return clouds;
    }
    
    start() {
        this.isRunning = true;
        console.log('Simulation started');
        this.addEvent('Launch sequence initiated');
    }
    
    pause() {
        this.isRunning = false;
    }
    
    reset() {
        this.time = 0;
        this.currentPhase = 0;
        this.phaseStartTime = 0;
        this.stage1 = {
            active: true,
            position: { x: 100, y: 100 }, // Start 100m above ground
            velocity: { x: 0, y: 0 },
            mass: this.dryMass + this.fuelMass,
            fuel: this.fuelMass,
            angle: 0,
            throttle: 0
        };
        this.stage2 = {
            active: false,
            position: { x: 100, y: 100 },
            velocity: { x: 0, y: 0 },
            visible: false
        };
        this.exhaustParticles = [];
        this.trajectory = [];
        this.events = [];
        this.isRunning = false;
        
        // Reset trajectory data
        this.trajectoryData = {
            time: [],
            altitude: [],
            velocity: [],
            maxPoints: 100
        };
        
        this.updateTelemetry();
        this.updateTrajectoryData();
    }
    
    updateTrajectoryData() {
        // Add current data point
        this.trajectoryData.time.push(this.time);
        this.trajectoryData.altitude.push(this.stage1.position.y / 1000); // Convert to km
        this.trajectoryData.velocity.push(Math.hypot(this.stage1.velocity.x, this.stage1.velocity.y));
        
        // Keep only last maxPoints
        if (this.trajectoryData.time.length > this.trajectoryData.maxPoints) {
            this.trajectoryData.time.shift();
            this.trajectoryData.altitude.shift();
            this.trajectoryData.velocity.shift();
        }
        
        // Update charts if they exist
        this.updateCharts();
    }
    
    updateCharts() {
        if (this.charts.altitude) {
            this.charts.altitude.data.labels = this.trajectoryData.time.map(t => t.toFixed(1));
            this.charts.altitude.data.datasets[0].data = this.trajectoryData.altitude;
            this.charts.altitude.update('none'); // Update without animation for performance
        }
        
        if (this.charts.velocity) {
            this.charts.velocity.data.labels = this.trajectoryData.time.map(t => t.toFixed(1));
            this.charts.velocity.data.datasets[0].data = this.trajectoryData.velocity;
            this.charts.velocity.update('none');
        }
    }
    
    update(deltaTime) {
        // Always render, even when paused
        this.render();
        
        if (!this.isRunning) return;
        
        // Clamp deltaTime to prevent physics explosions
        const dt = Math.min(deltaTime * this.simulationSpeed, 0.1);
        
        // Debug: Log occasionally
        if (Math.random() < 0.01) {
            console.log('Update:', { dt, time: this.time.toFixed(1), phase: this.currentPhase, y: this.stage1.position.y.toFixed(0) });
        }
        
        this.time += dt;
        
        // Update phase
        this.updatePhase();
        
        // Update physics
        if (this.stage1.active) {
            this.updateStage1Physics(dt);
        }
        
        if (this.stage2.visible) {
            this.updateStage2Physics(dt);
        }
        
        // Update camera to follow stage 1
        this.updateCamera();
        
        // Update particles
        this.updateParticles(dt);
        
        // Record trajectory - track from the tail end (engine side) always
        // When angle is 0 (nose up), tail is at -400 offset
        // When angle is π (nose down), tail is at +400 offset
        let trajectoryX, trajectoryY;
        
        // Tail is always opposite to nose direction
        // For 0° (vertical up): tail at bottom (-400 on angle axis)
        // For 180° (vertical down): tail at top (+400 on angle axis)
        trajectoryX = this.stage1.position.x - Math.sin(this.stage1.angle) * 400;
        trajectoryY = this.stage1.position.y - Math.cos(this.stage1.angle) * 400;
        
        if (this.trajectory.length === 0 || 
            Math.hypot(trajectoryX - this.trajectory[this.trajectory.length - 1].x,
                      trajectoryY - this.trajectory[this.trajectory.length - 1].y) > 500) {
            this.trajectory.push({ x: trajectoryX, y: trajectoryY });
            if (this.trajectory.length > 200) {
                this.trajectory.shift();
            }
        }
        
        // Update telemetry (throttled to every 3rd frame for performance)
        this.telemetryFrameCount++;
        if (this.telemetryFrameCount >= 3) {
            this.updateTelemetry();
            this.updateTrajectoryData();
            this.telemetryFrameCount = 0;
        }
    }
    
    updatePhase() {
        const phase = this.phases[this.currentPhase];
        const phaseTime = this.time - this.phaseStartTime;
        
        if (phaseTime >= phase.duration && this.currentPhase < this.phases.length - 1) {
            this.currentPhase++;
            this.phaseStartTime = this.time;
            this.addEvent(`Phase: ${this.phases[this.currentPhase].name}`);
            
            // Handle stage separation
            if (this.currentPhase === 3) {
                this.separateStages();
            }
        }
        
        this.stage1.throttle = this.phases[this.currentPhase].throttle;
    }
    
    separateStages() {
        this.stage2.active = true;
        this.stage2.visible = true;
        this.stage2.position = { ...this.stage1.position };
        this.stage2.velocity = { 
            x: this.stage1.velocity.x + 10, // Slight rightward push
            y: this.stage1.velocity.y + 100 // Strong upward separation boost
        };
        
        // Stage 2 angle should continue upward trajectory
        this.stage2.angle = this.stage1.angle;
        
        // Stage 1 loses mass
        this.stage1.mass = this.dryMass + this.stage1.fuel;
        
        this.addEvent('Stage separation successful');
    }
    
    updateStage1Physics(dt) {
        const phase = this.phases[this.currentPhase];
        
        // Suicide burn calculation for landing phase (optimal deceleration)
        let dynamicThrottle = this.stage1.throttle;
        if (this.currentPhase === 8) { // Landing burn phase
            const altitude = this.stage1.position.y;
            const velocity = Math.abs(this.stage1.velocity.y);
            
            // Calculate required deceleration for soft landing using kinematic equation
            // v^2 = 2*a*d => a = v^2 / (2*d)
            // Add safety margin and ensure minimum altitude threshold
            const safetyMargin = 1.5;
            const minAltitude = Math.max(altitude, 100); // Prevent division by small numbers
            const requiredDecel = (velocity * velocity) / (2 * minAltitude) * safetyMargin;
            
            // Convert to throttle (thrust/mass - gravity)
            const availableThrust = this.maxThrust / this.stage1.mass;
            const requiredThrottle = Math.min(1.0, Math.max(0.3, (requiredDecel + this.G) / availableThrust));
            
            dynamicThrottle = requiredThrottle;
            this.stage1.throttle = dynamicThrottle; // Update throttle for exhaust generation
        }
        
        // Calculate forces
        let thrust = this.maxThrust * dynamicThrottle;
        
        // Thrust vector based on angle
        const thrustX = thrust * Math.sin(this.stage1.angle);
        const thrustY = thrust * Math.cos(this.stage1.angle);
        
        // Gravity
        const gravityY = -this.stage1.mass * this.G;
        
        // Drag (simplified)
        const altitude = this.stage1.position.y;
        const density = Math.max(0, 1.225 * Math.exp(-altitude / 8500));
        const velocity = Math.hypot(this.stage1.velocity.x, this.stage1.velocity.y);
        const dragForce = 0.5 * density * velocity * velocity * 10; // Simplified drag
        const dragX = velocity > 0 ? -dragForce * (this.stage1.velocity.x / velocity) : 0;
        const dragY = velocity > 0 ? -dragForce * (this.stage1.velocity.y / velocity) : 0;
        
        // Total forces
        const totalForceX = thrustX + dragX;
        const totalForceY = thrustY + gravityY + dragY;
        
        // Acceleration
        const accelX = totalForceX / this.stage1.mass;
        const accelY = totalForceY / this.stage1.mass;
        
        // Update velocity
        this.stage1.velocity.x += accelX * dt;
        this.stage1.velocity.y += accelY * dt;
        
        // Update position
        this.stage1.position.x += this.stage1.velocity.x * dt;
        this.stage1.position.y += this.stage1.velocity.y * dt;
        
        // Keep rocket on pad during pre-launch
        if (this.currentPhase === 0) {
            this.stage1.position.y = 100;
            this.stage1.velocity = { x: 0, y: 0 };
        }
        
        // Ground collision (only check after launch phase, not during pre-launch)
        if (this.currentPhase > 1 && this.stage1.position.y <= 0 && this.stage1.velocity.y <= 0) {
            this.stage1.position.y = 0;
            this.stage1.velocity.y = 0;
            
            const landingSpeed = Math.abs(this.stage1.velocity.y);
            
            // Successful landing - any touchdown in landing phase is soft due to suicide burn
            if (this.currentPhase >= 7) { // Re-entry or later
                this.stage1.velocity = { x: 0, y: 0 };
                this.stage1.throttle = 0;
                this.currentPhase = 10; // Phase 10: LANDED
                this.addEvent(`✓ Successful soft landing! (${landingSpeed.toFixed(1)} m/s)`);
                this.isRunning = false;
            } else if (landingSpeed > 15) {
                // Hard landing during early phases
                this.stage1.velocity = { x: 0, y: 0 };
                this.addEvent('Hard landing!');
                this.isRunning = false;
            }
        }
        
        // Update angle smoothly
        let targetAngle = phase.targetAngle;
        
        // Special handling for boostback flip - rotate the shorter direction
        if (this.currentPhase === 4 && Math.abs(this.stage1.angle - targetAngle) > Math.PI) {
            // Flip maneuver - rotate through smaller angle
            const angleDiff = targetAngle - this.stage1.angle;
            if (angleDiff > Math.PI) {
                this.stage1.angle += 2 * Math.PI;
            } else if (angleDiff < -Math.PI) {
                this.stage1.angle -= 2 * Math.PI;
            }
        }
        
        const angleDiff = targetAngle - this.stage1.angle;
        this.stage1.angle += angleDiff * 0.5 * dt;
        
        // Safety check for NaN values
        if (isNaN(this.stage1.position.x) || isNaN(this.stage1.position.y)) {
            console.error('NaN detected in position, resetting');
            this.reset();
            return;
        }
        
        // Fuel consumption
        if (this.stage1.throttle > 0 && this.stage1.fuel > 0) {
            const fuelRate = (this.maxThrust / (this.isp * this.G)) * this.stage1.throttle;
            this.stage1.fuel -= fuelRate * dt;
            this.stage1.fuel = Math.max(0, this.stage1.fuel);
            this.stage1.mass = this.dryMass + this.stage1.fuel;
        }
        
        // Generate exhaust particles - always generate when throttle > 0
        if (this.stage1.throttle > 0.01 && this.stage1.fuel > 0) {
            this.generateExhaust();
        }
    }
    
    updateStage2Physics(dt) {
        // Stage 2 continues with thrust after separation (phases 4+)
        if (this.currentPhase >= 4) {
            // Stage 2 has its own engines and continues upward
            const stage2Thrust = 934000; // N (1 Merlin Vacuum engine)
            const stage2Mass = 4000; // kg (approximate)
            
            // Thrust acceleration (upward)
            const thrustAccel = stage2Thrust / stage2Mass;
            
            // Apply thrust and gravity
            this.stage2.velocity.y += (thrustAccel - this.G) * dt;
            
            // Slight rightward drift to separate from stage 1
            this.stage2.velocity.x += 2 * dt;
        } else {
            // Before separation, just apply gravity
            this.stage2.velocity.y -= this.G * dt;
        }
        
        // Update position
        this.stage2.position.x += this.stage2.velocity.x * dt;
        this.stage2.position.y += this.stage2.velocity.y * dt;
    }
    
    generateExhaust() {
        // Increase particles during boostback and landing burns for dramatic effect
        const isBoostbackOrLanding = this.currentPhase === 4 || this.currentPhase === 8; // Phase 4: Boostback, Phase 8: Landing Burn
        const baseCount = isBoostbackOrLanding ? 12 : 2; // More particles during critical burns
        const exhaustCount = Math.floor(this.stage1.throttle * baseCount);
        
        // Debug log when bloom is active
        if (isBoostbackOrLanding && this.time % 1 < 0.1) {
            console.log(`BLOOM ACTIVE - Phase: ${this.currentPhase}, Particles: ${exhaustCount}, Throttle: ${this.stage1.throttle}`);
        }
        
        for (let i = 0; i < exhaustCount; i++) {
            // Calculate exhaust position at tail end (engine) of rocket - 400 = half rocket height
            const rocketBottom = {
                x: this.stage1.position.x - Math.sin(this.stage1.angle) * 400,
                y: this.stage1.position.y - Math.cos(this.stage1.angle) * 400
            };
            
            // Larger, more dramatic particles during boostback/landing
            const sizeMultiplier = isBoostbackOrLanding ? 4.0 : 1;
            const spreadMultiplier = isBoostbackOrLanding ? 3 : 1;
            
            // Calculate perpendicular spread (sideways relative to rocket orientation)
            const perpX = Math.cos(this.stage1.angle); // Perpendicular to rocket axis
            const perpY = -Math.sin(this.stage1.angle);
            const lateralSpread = (Math.random() - 0.5) * 10 * spreadMultiplier;
            
            // Calculate thrust direction (opposite to rocket orientation)
            const thrustDirX = -Math.sin(this.stage1.angle);
            const thrustDirY = -Math.cos(this.stage1.angle);
            
            // Exhaust velocity relative to rocket (based on physics: exhaust exits at high speed relative to engine)
            const exhaustSpeed = isBoostbackOrLanding ? 150 : 100; // Higher speed during critical burns
            const exhaustSpread = isBoostbackOrLanding ? 40 : 20;
            
            // Particle velocity = rocket velocity + exhaust velocity (relative to rocket)
            this.exhaustParticles.push({
                x: rocketBottom.x + perpX * lateralSpread,
                y: rocketBottom.y + perpY * lateralSpread,
                vx: this.stage1.velocity.x + thrustDirX * exhaustSpeed + perpX * (Math.random() - 0.5) * exhaustSpread,
                vy: this.stage1.velocity.y + thrustDirY * exhaustSpeed + perpY * (Math.random() - 0.5) * exhaustSpread,
                life: 1.0,
                size: (Math.random() * 3 + 2) * sizeMultiplier,
                color: Math.random() < 0.5 ? '#ff6600' : '#ffaa00',
                isBoostback: isBoostbackOrLanding // Tag for special rendering
            });
        }
    }
    
    updateParticles(dt) {
        for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
            const p = this.exhaustParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy -= this.G * dt * 0.5; // Gravity on particles
            p.life -= dt * 3; // Faster fade (changed from 2 to 3)
            p.size *= 1.05;
            
            if (p.life <= 0) {
                this.exhaustParticles.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        // Follow stage 1
        this.camera.x = this.stage1.position.x;
        this.camera.y = this.stage1.position.y;
        
        // Auto-zoom based on altitude with smoother transitions
        const altitude = this.stage1.position.y;
        if (altitude < 5000) {
            this.camera.targetZoom = 1.0;
        } else if (altitude < 20000) {
            this.camera.targetZoom = 0.7;
        } else if (altitude < 50000) {
            this.camera.targetZoom = 0.4;
        } else {
            this.camera.targetZoom = 0.2;
        }
        
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.02;
    }
    
    worldToScreen(worldX, worldY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height * 0.7;
        
        const relX = (worldX - this.camera.x) * this.camera.zoom;
        const relY = -(worldY - this.camera.y) * this.camera.zoom; // Flip Y for screen coords
        
        return {
            x: centerX + relX,
            y: centerY + relY
        };
    }
    
    render() {
        try {
            // Clear canvas
            this.ctx.fillStyle = 'transparent';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background gradient
            this.drawBackground();
            
            // Draw stars
            this.drawStars();
            
            // Draw clouds
            this.drawClouds();
            
            // Draw trajectory
            this.drawTrajectory();
            
            // Draw ground - disabled, using background images instead
            // this.drawGround();
            
            // Draw launch pad
            this.drawLaunchPad();
            
            // Draw exhaust particles
            this.drawExhaust();
            
            // Draw stage 2 if visible
            if (this.stage2.visible) {
                this.drawStage2();
            }
            
            // Draw stage 1 (main booster)
            this.drawStage1();
            
            // Debug: Draw FPS counter
            this.ctx.fillStyle = 'lime';
            this.ctx.font = '20px monospace';
            this.ctx.fillText(`FPS: ${Math.round(1/Math.max(0.001, lastTime ? (performance.now() - lastTime)/1000 : 0.016))}`, 10, 30);
            this.ctx.fillText(`Time: ${this.time.toFixed(1)}s`, 10, 55);
            this.ctx.fillText(`Y: ${this.stage1.position.y.toFixed(0)}m`, 10, 80);
            this.ctx.fillText(`Phase: ${this.currentPhase}`, 10, 105);
        } catch (error) {
            console.error('Render error:', error);
            this.isRunning = false;
        }
    }
    
    drawBackground() {
        const altitude = this.stage1.position.y;
        const canvas = this.canvas;
        
        // Draw launchpad background during early phases (pre-launch through separation)
        if (this.currentPhase <= 3 && this.sprites.backgroundsLoaded && altitude < 10000) {
            // First draw the procedural sky background
            this.drawProceduralSky(altitude);
            
            // Then draw launchpad image with green screen transparency
            const padOpacity = Math.max(0, 1 - altitude / 10000);
            this.drawImageWithChromaKey(this.sprites.launchpad, padOpacity);
            return;
        }
        
        // Draw landing pad background during landing phases (re-entry onwards)
        if (this.currentPhase >= 7 && this.sprites.backgroundsLoaded && altitude < 5000) {
            // First draw the procedural sky background
            this.drawProceduralSky(altitude);
            
            // Then draw landing pad image with green screen transparency
            const padOpacity = Math.max(0, 1 - altitude / 5000);
            this.drawImageWithChromaKey(this.sprites.landingpad, padOpacity);
            return;
        }
        
        // Procedural sky gradient for all other phases
        this.drawProceduralSky(altitude);
    }
    
    drawProceduralSky(altitude) {
        const canvas = this.canvas;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        if (altitude < 5000) {
            // Low altitude - realistic atmosphere with horizon
            gradient.addColorStop(0, '#0a1929'); // Dark blue at top
            gradient.addColorStop(0.2, '#1e3a5f'); // Medium blue
            gradient.addColorStop(0.5, '#2e5984'); // Lighter blue
            gradient.addColorStop(0.75, '#4a7ba7'); // Sky blue
            gradient.addColorStop(0.9, '#87CEEB'); // Light sky blue
            gradient.addColorStop(1, '#B0D4E3'); // Horizon haze
        } else if (altitude < 20000) {
            // Medium altitude - transitioning to darker blue
            const factor = (altitude - 5000) / 15000;
            gradient.addColorStop(0, '#000814');
            gradient.addColorStop(0.3, this.lerpColor('#1e3a5f', '#001d3d', factor));
            gradient.addColorStop(0.6, this.lerpColor('#2e5984', '#003566', factor));
            gradient.addColorStop(1, this.lerpColor('#87CEEB', '#1e4d7b', factor));
        } else if (altitude < 50000) {
            // High altitude - deep blue to black
            const factor = (altitude - 20000) / 30000;
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.3, this.lerpColor('#000814', '#000000', factor));
            gradient.addColorStop(0.7, this.lerpColor('#001d3d', '#000814', factor));
            gradient.addColorStop(1, this.lerpColor('#003566', '#001020', factor));
        } else {
            // Space - pure darkness with subtle gradient
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.4, '#000508');
            gradient.addColorStop(0.8, '#000814');
            gradient.addColorStop(1, '#001020');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add atmospheric glow at horizon for low altitudes
        if (altitude < 15000) {
            const glowGradient = this.ctx.createRadialGradient(
                canvas.width / 2, canvas.height * 0.85, 0,
                canvas.width / 2, canvas.height * 0.85, canvas.width * 0.6
            );
            const glowOpacity = Math.max(0, 1 - altitude / 15000) * 0.3;
            glowGradient.addColorStop(0, `rgba(255, 200, 150, ${glowOpacity})`);
            glowGradient.addColorStop(0.5, `rgba(135, 206, 235, ${glowOpacity * 0.5})`);
            glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
        }
    }
    
    drawImageWithChromaKey(image, opacity) {
        const canvas = this.canvas;
        
        // Calculate scaling and positioning
        const imgAspect = image.width / image.height;
        const canvasAspect = canvas.width / canvas.height;
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
            drawHeight = canvas.height;
            drawWidth = drawHeight * imgAspect;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = canvas.width;
            drawHeight = drawWidth / imgAspect;
            offsetX = 0;
            offsetY = canvas.height - drawHeight;
        }
        
        // Create temporary canvas for chroma key processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw image to temp canvas
        tempCtx.drawImage(image, 0, 0);
        
        // Get image data
        const imageData = tempCtx.getImageData(0, 0, image.width, image.height);
        const data = imageData.data;
        
        // Remove green screen (chroma key)
        // Target green color with tolerance
        const greenThreshold = 100; // Adjust for green detection sensitivity
        const tolerance = 80; // Color tolerance
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is predominantly green
            if (g > greenThreshold && g > r + 30 && g > b + 30) {
                // Calculate how green it is
                const greenness = Math.min(1, (g - Math.max(r, b)) / tolerance);
                // Make it transparent
                data[i + 3] = Math.max(0, data[i + 3] * (1 - greenness));
            }
        }
        
        // Put processed image data back
        tempCtx.putImageData(imageData, 0, 0);
        
        // Draw to main canvas with opacity
        this.ctx.globalAlpha = opacity;
        this.ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);
        this.ctx.globalAlpha = 1;
    }
    
    lerpColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
    
    drawStars() {
        const altitude = this.stage1.position.y;
        const visibility = Math.min(1, altitude / 15000); // Stars become visible higher up
        
        this.stars.forEach(star => {
            const screen = this.worldToScreen(star.x, star.y);
            if (screen.y < 0 || screen.y > this.canvas.height) return;
            
            // Twinkle effect
            const twinkle = 0.7 + Math.sin(this.time * star.brightness * 3) * 0.3;
            const alpha = star.brightness * visibility * twinkle;
            
            // Star colors - some are slightly colored
            const colors = ['#ffffff', '#fff8dc', '#e6f2ff', '#fffacd'];
            const color = colors[Math.floor(star.brightness * 4) % 4];
            
            this.ctx.fillStyle = `rgba(${this.hexToRgb(color).r}, ${this.hexToRgb(color).g}, ${this.hexToRgb(color).b}, ${alpha})`;
            
            // Larger stars get a subtle glow
            if (star.size > 1.5 && visibility > 0.5) {
                this.ctx.shadowBlur = 3;
                this.ctx.shadowColor = color;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawClouds() {
        const altitude = this.stage1.position.y;
        if (altitude > 15000) return;
        
        const fadeOut = Math.max(0, 1 - altitude / 15000);
        
        this.clouds.forEach(cloud => {
            const screen = this.worldToScreen(cloud.x, cloud.y);
            const screenWidth = cloud.width * this.camera.zoom;
            const screenHeight = cloud.height * this.camera.zoom;
            
            // Multi-layer cloud effect for depth
            const baseOpacity = cloud.opacity * fadeOut * 0.8;
            
            // Shadow layer
            this.ctx.fillStyle = `rgba(180, 180, 200, ${baseOpacity * 0.3})`;
            this.ctx.beginPath();
            this.ctx.ellipse(screen.x + 5, screen.y + 8, screenWidth / 2, screenHeight / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Main cloud body
            this.ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity})`;
            this.ctx.beginPath();
            this.ctx.ellipse(screen.x, screen.y, screenWidth / 2, screenHeight / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight layer
            this.ctx.fillStyle = `rgba(255, 255, 255, ${baseOpacity * 0.6})`;
            this.ctx.beginPath();
            this.ctx.ellipse(screen.x - screenWidth * 0.15, screen.y - screenHeight * 0.15, 
                           screenWidth / 3, screenHeight / 3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawGround() {
        const groundY = this.worldToScreen(0, 0).y;
        const altitude = this.stage1.position.y;
        
        if (groundY < 0 || groundY > this.canvas.height) return;
        
        // Realistic ground with multiple layers
        const groundGradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        
        if (altitude < 10000) {
            // Close view - detailed ground
            groundGradient.addColorStop(0, '#8B7355'); // Sandy/soil color at horizon
            groundGradient.addColorStop(0.3, '#6B8E23'); // Olive green
            groundGradient.addColorStop(0.6, '#556B2F'); // Dark olive
            groundGradient.addColorStop(1, '#2F4F2F'); // Dark green
        } else {
            // Distant view - simplified
            groundGradient.addColorStop(0, '#A0826D');
            groundGradient.addColorStop(1, '#3A5F0B');
        }
        
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);
        
        // Horizon atmospheric perspective
        const horizonGradient = this.ctx.createLinearGradient(0, groundY - 20, 0, groundY + 20);
        horizonGradient.addColorStop(0, 'rgba(135, 206, 235, 0)');
        horizonGradient.addColorStop(0.5, 'rgba(135, 206, 235, 0.15)');
        horizonGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
        
        this.ctx.fillStyle = horizonGradient;
        this.ctx.fillRect(0, groundY - 20, this.canvas.width, 40);
        
        // Horizon line
        this.ctx.strokeStyle = '#6B8E23';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.canvas.width, groundY);
        this.ctx.stroke();
    }
    
    drawLaunchPad() {
        const padPos = this.worldToScreen(100, 0);
        const size = 40 * this.camera.zoom;
        
        // Pad platform
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(padPos.x - size, padPos.y, size * 2, size * 0.3);
        
        // Support structures
        this.ctx.fillStyle = '#cc3333';
        const towerHeight = 60 * this.camera.zoom;
        const towerWidth = 6 * this.camera.zoom;
        
        // Four towers
        [-size * 0.8, -size * 0.4, size * 0.4, size * 0.8].forEach(offset => {
            this.ctx.fillRect(
                padPos.x + offset - towerWidth / 2,
                padPos.y - towerHeight,
                towerWidth,
                towerHeight
            );
        });
    }
    
    drawStage1() {
        if (!this.sprites.loaded) {
            // Fallback to drawing if sprites not loaded
            this.drawStage1Fallback();
            return;
        }
        
        const pos = this.worldToScreen(this.stage1.position.x, this.stage1.position.y);
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(-this.stage1.angle);
        
        const scale = this.camera.zoom;
        
        // Choose sprite: phase-specific if available, otherwise use stage1/full
        let sprite;
        // Try to use phase-specific sprite if available (don't wait for all to load)
        if (this.currentPhase <= 9) {
            const phaseSprite = this.sprites[`rocket_phase${this.currentPhase}`];
            if (phaseSprite && phaseSprite.complete && phaseSprite.naturalWidth > 0) {
                sprite = phaseSprite;
            } else {
                // Fallback to default sprites
                sprite = this.stage2.visible ? this.sprites.stage1 : this.sprites.full;
            }
        } else {
            sprite = this.stage2.visible ? this.sprites.stage1 : this.sprites.full;
        }
        
        // Scale sprite to match our rocket size (800 pixels height - 2x scale)
        const spriteHeight = 800 * scale;
        const spriteWidth = (sprite.width / sprite.height) * spriteHeight;
        
        this.ctx.drawImage(
            sprite,
            -spriteWidth / 2,
            -spriteHeight / 2,
            spriteWidth,
            spriteHeight
        );
        
        this.ctx.restore();
    }
    
    drawStage1Fallback() {
        const pos = this.worldToScreen(this.stage1.position.x, this.stage1.position.y);
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(-this.stage1.angle); // Negative because screen Y is flipped
        
        const scale = this.camera.zoom;
        const width = 140 * scale; // 2x from original 70
        const height = 800 * scale; // 2x from original 400
        
        // Main body - white/light gray
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.strokeStyle = '#d0d0d0';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
        this.ctx.strokeRect(-width / 2, -height / 2, width, height);
        
        // Black interstage band
        this.ctx.fillStyle = '#0a0a0a';
        const bandY = height * 0.1 - height / 2;
        const bandHeight = height * 0.08;
        this.ctx.fillRect(-width / 2, bandY, width, bandHeight);
        
        // SpaceX logo area (white text on body)
        this.ctx.fillStyle = '#000';
        this.ctx.font = `bold ${Math.max(8, 12 * scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FALCON 9', 0, height * 0.25 - height / 2);
        
        // USA flag area (simplified)
        this.ctx.fillStyle = '#002868';
        this.ctx.fillRect(-width / 2 + 3 * scale, -height * 0.35, width * 0.15, height * 0.08);
        
        // Nose cone - pointed tip
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.strokeStyle = '#d0d0d0';
        this.ctx.beginPath();
        this.ctx.moveTo(-width / 2, -height / 2);
        this.ctx.lineTo(0, -height / 2 - 20 * scale);
        this.ctx.lineTo(width / 2, -height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Landing legs (4 legs) - deployed when near landing
        const nearGround = this.stage1.position.y < 5000;
        const legAngle = nearGround ? Math.PI / 4 : Math.PI / 8;
        const legLength = 30 * scale;
        
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 3 * scale;
        this.ctx.lineCap = 'round';
        
        // Draw all 4 legs
        [-1, 1].forEach(side => {
            // Upper leg segment
            this.ctx.beginPath();
            this.ctx.moveTo(width / 2.5 * side, height / 2 - 15 * scale);
            const midX = (width / 2 + legLength * 0.6 * Math.sin(legAngle)) * side;
            const midY = height / 2 - 5 * scale + legLength * 0.3 * Math.cos(legAngle);
            this.ctx.lineTo(midX, midY);
            this.ctx.stroke();
            
            // Lower leg segment with foot pad
            this.ctx.beginPath();
            this.ctx.moveTo(midX, midY);
            const footX = (width / 2 + legLength * Math.sin(legAngle)) * side;
            const footY = height / 2 + legLength * Math.cos(legAngle);
            this.ctx.lineTo(footX, footY);
            this.ctx.stroke();
            
            // Foot pad
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(footX - 4 * scale * side, footY - 2 * scale, 8 * scale, 3 * scale);
        });
        
        // Grid fins at top (4 fins)
        this.ctx.fillStyle = '#888888';
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;
        
        [-1, 1].forEach(side => {
            // Top fins
            const finWidth = 18 * scale;
            const finHeight = 12 * scale;
            const finY = -height / 2 + 25 * scale;
            
            this.ctx.fillRect(
                width / 2 * side,
                finY - finHeight / 2,
                finWidth * side,
                finHeight
            );
            this.ctx.strokeRect(
                width / 2 * side,
                finY - finHeight / 2,
                finWidth * side,
                finHeight
            );
            
            // Draw grid pattern on fins
            this.ctx.strokeStyle = '#555555';
            this.ctx.lineWidth = 0.5;
            for (let i = 1; i < 4; i++) {
                const lineX = width / 2 * side + (finWidth / 4 * i) * side;
                this.ctx.beginPath();
                this.ctx.moveTo(lineX, finY - finHeight / 2);
                this.ctx.lineTo(lineX, finY + finHeight / 2);
                this.ctx.stroke();
            }
        });
        
        // Engine section - black with detailed octaweb
        this.ctx.fillStyle = '#0a0a0a';
        const engineSectionHeight = 15 * scale;
        this.ctx.fillRect(-width / 2, height / 2 - engineSectionHeight, width, engineSectionHeight);
        
        // Octaweb pattern
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4);
            this.ctx.moveTo(0, height / 2 - engineSectionHeight / 2);
            this.ctx.lineTo(
                Math.cos(angle) * width / 2,
                height / 2 - engineSectionHeight / 2 + Math.sin(angle) * width / 2
            );
        }
        this.ctx.stroke();
        
        // Engine nozzles (9 Merlin engines - center + 8 in circle)
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        
        // Center engine
        this.ctx.beginPath();
        this.ctx.arc(0, height / 2 - 5 * scale, 4 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Ring of 8 engines
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4);
            const engineRadius = width * 0.28;
            this.ctx.beginPath();
            this.ctx.arc(
                Math.cos(angle) * engineRadius,
                height / 2 - 5 * scale + Math.sin(angle) * engineRadius * 0.3,
                3.5 * scale,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawStage2() {
        if (!this.sprites.loaded) {
            // Fallback to drawing if sprites not loaded
            this.drawStage2Fallback();
            return;
        }
        
        const pos = this.worldToScreen(this.stage2.position.x, this.stage2.position.y);
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(-this.stage2.angle);
        
        const scale = this.camera.zoom;
        const sprite = this.sprites.stage2;
        
        // Scale sprite to match stage 2 size (400 pixels height - 2x scale)
        const spriteHeight = 400 * scale;
        const spriteWidth = (sprite.width / sprite.height) * spriteHeight;
        
        this.ctx.drawImage(
            sprite,
            -spriteWidth / 2,
            -spriteHeight / 2,
            spriteWidth,
            spriteHeight
        );
        
        this.ctx.restore();
    }
    
    drawStage2Fallback() {
        const pos = this.worldToScreen(this.stage2.position.x, this.stage2.position.y);
        
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(-this.stage2.angle);
        
        const scale = this.camera.zoom;
        const width = 120 * scale; // 2x from original 60
        const height = 400 * scale; // 2x from original 200
        
        // Main body - white/light gray
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.strokeStyle = '#d0d0d0';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
        this.ctx.strokeRect(-width / 2, -height / 2, width, height);
        
        // Payload fairing - larger and more detailed
        this.ctx.fillStyle = '#e8e8e8';
        this.ctx.strokeStyle = '#d0d0d0';
        this.ctx.beginPath();
        this.ctx.moveTo(-width / 2, -height / 2);
        this.ctx.lineTo(0, -height / 2 - 30 * scale);
        this.ctx.lineTo(width / 2, -height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Fairing separation line
        this.ctx.strokeStyle = '#c0c0c0';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -height / 2 - 30 * scale);
        this.ctx.lineTo(0, -height / 2);
        this.ctx.stroke();
        
        // Engine section
        this.ctx.fillStyle = '#0a0a0a';
        const engineHeight = 8 * scale;
        this.ctx.fillRect(-width / 2, height / 2 - engineHeight, width, engineHeight);
        
        // Single vacuum engine nozzle
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(0, height / 2 - 3 * scale, 5 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawExhaust() {
        this.exhaustParticles.forEach(p => {
            const screen = this.worldToScreen(p.x, p.y);
            
            // Enhanced bloom effect for boostback and landing burns
            if (p.isBoostback) {
                this.ctx.shadowBlur = 50 * this.camera.zoom; // Increased from 30 to 50
                this.ctx.shadowColor = p.color;
                this.ctx.globalAlpha = p.life * 0.8; // Increased from 0.6 to 0.8 for more intensity
            } else {
                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = p.life * 0.3; // Standard exhaust
            }
            
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, p.size * this.camera.zoom, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Reset shadow for next drawing
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawTrajectory() {
        if (this.trajectory.length < 2) return;
        
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        
        this.trajectory.forEach((point, i) => {
            const screen = this.worldToScreen(point.x, point.y);
            if (i === 0) {
                this.ctx.moveTo(screen.x, screen.y);
            } else {
                this.ctx.lineTo(screen.x, screen.y);
            }
        });
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    updateTelemetry() {
        const mins = Math.floor(this.time / 60);
        const secs = Math.floor(this.time % 60);
        document.getElementById('missionTime').textContent = 
            `T+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        document.getElementById('altitude').textContent = 
            (this.stage1.position.y / 1000).toFixed(2) + ' km';
        
        const velocity = Math.hypot(this.stage1.velocity.x, this.stage1.velocity.y);
        document.getElementById('velocity').textContent = 
            velocity.toFixed(0) + ' m/s';
        
        document.getElementById('verticalSpeed').textContent = 
            this.stage1.velocity.y.toFixed(0) + ' m/s';
        
        const fuelPercent = (this.stage1.fuel / this.fuelMass) * 100;
        document.getElementById('fuel').textContent = fuelPercent.toFixed(1) + '%';
        
        document.getElementById('throttle').textContent = 
            (this.stage1.throttle * 100).toFixed(0) + '%';
        
        document.getElementById('phaseName').textContent = 
            this.phases[this.currentPhase].name;
    }
    
    addEvent(message) {
        this.events.unshift(message);
        if (this.events.length > 10) {
            this.events.pop();
        }
        
        const eventsList = document.getElementById('eventsList');
        eventsList.innerHTML = this.events.map(event => 
            `<div class="event-item">${event}</div>`
        ).join('');
    }
}

// Initialize
let simulation;
let lastTime = null;

function animate(currentTime) {
    if (lastTime === null) {
        lastTime = currentTime;
    }
    
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    if (simulation) {
        simulation.update(deltaTime);
    }
    
    requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing simulation');
    const canvas = document.getElementById('simulationCanvas');
    console.log('Canvas element:', canvas);
    simulation = new Falcon9Simulation2D(canvas);
    console.log('Simulation created');
    
    document.getElementById('playBtn').addEventListener('click', () => {
        console.log('Play button clicked');
        const btn = document.getElementById('playBtn');
        if (simulation.isRunning) {
            simulation.pause();
            btn.textContent = '▶ PLAY';
        } else {
            simulation.start();
            btn.textContent = '⏸ PAUSE';
        }
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        simulation.reset();
        document.getElementById('playBtn').textContent = '▶ PLAY';
    });
    
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        simulation.simulationSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = e.target.value + 'x';
    });
    
    // Initialize Charts
    if (typeof Chart !== 'undefined') {
        const chartConfig = {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: '#00d4ff'
                        },
                        ticks: {
                            color: '#8b92a7',
                            maxTicksLimit: 6
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        ticks: {
                            color: '#8b92a7'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        };
        
        // Altitude Chart
        const altCtx = document.getElementById('altitudeChart').getContext('2d');
        simulation.charts.altitude = new Chart(altCtx, {
            ...chartConfig,
            data: {
                labels: [],
                datasets: [{
                    label: 'Altitude',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true
                }]
            },
            options: {
                ...chartConfig.options,
                scales: {
                    ...chartConfig.options.scales,
                    y: {
                        ...chartConfig.options.scales.y,
                        title: {
                            display: true,
                            text: 'Altitude (km)',
                            color: '#00d4ff'
                        }
                    }
                }
            }
        });
        
        // Velocity Chart
        const velCtx = document.getElementById('velocityChart').getContext('2d');
        simulation.charts.velocity = new Chart(velCtx, {
            ...chartConfig,
            data: {
                labels: [],
                datasets: [{
                    label: 'Velocity',
                    data: [],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true
                }]
            },
            options: {
                ...chartConfig.options,
                scales: {
                    ...chartConfig.options.scales,
                    y: {
                        ...chartConfig.options.scales.y,
                        title: {
                            display: true,
                            text: 'Velocity (m/s)',
                            color: '#00ff88'
                        }
                    }
                }
            }
        });
        
        console.log('Trajectory charts initialized');
    } else {
        console.warn('Chart.js not loaded, graphs will not be displayed');
    }
    
    requestAnimationFrame(animate);
});
