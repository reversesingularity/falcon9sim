// app.js - Main Application Controller

document.addEventListener('DOMContentLoaded', () => {
    // Initialize simulation and visualization
    const simulation = new Falcon9Simulation();
    const visualization = new Visualization('canvas3d');

    // Make simulation globally accessible for visualization
    window.simulation = simulation;

    // Initialize charts if available
    let charts = null;
    if (typeof TelemetryCharts !== 'undefined') {
        charts = new TelemetryCharts();
    }

    // Frame counter for chart throttling
    let frameCount = 0;

    // Track running state for debrief detection
    let wasRunning = false;

    // Animation loop
    let lastTime = 0;

    // Mission callout system
    const MISSION_CALLOUTS = [
        { phase: 1, timeInPhase: 5, text: 'LIFTOFF — Falcon 9 has cleared the tower' },
        { phase: 1, timeInPhase: 30, text: 'MECO-1 — Max-Q throttle-down initiated' },
        { phase: 1, timeInPhase: 55, text: 'MECO approaching — T-5 seconds to staging' },
        { phase: 3, timeInPhase: 0, text: 'STAGE SEPARATION — Booster sep confirmed' },
        { phase: 4, timeInPhase: 2, text: 'BOOSTBACK BURN — Returning to landing zone' },
        { phase: 6, timeInPhase: 0, text: 'ENTRY BURN — Thermal protection initiated' },
        { phase: 8, timeInPhase: 0, text: 'LANDING BURN — LD-1 is the target' },
        { phase: 9, timeInPhase: 0, text: 'TOUCHDOWN — Falcon 9 has landed!' },
    ];
    const shownCallouts = new Set();

    function checkCallouts(telemetry) {
        const phaseTime = simulation.time - simulation.phaseStartTime;
        MISSION_CALLOUTS.forEach((callout) => {
            const key = `${callout.phase}-${callout.timeInPhase}`;
            if (!shownCallouts.has(key) &&
                simulation.currentPhase === callout.phase &&
                phaseTime >= callout.timeInPhase) {
                shownCallouts.add(key);
                showCallout(callout.text);
                addEventToLog(callout.text, telemetry.time);
            }
        });
    }

    function showCallout(text) {
        const el = document.getElementById('missionCallout');
        if (!el) return;
        el.textContent = text;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 4000);
    }

    function addEventToLog(text, time) {
        const eventsLog = document.getElementById('eventsLog');
        if (!eventsLog) return;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const timeStr = `T+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const item = document.createElement('div');
        item.className = 'event-item';
        item.innerHTML = `<span class="event-time">${timeStr}</span>${text}`;
        eventsLog.insertBefore(item, eventsLog.firstChild);
    }

    // Landing debrief modal
    function showLandingDebrief(telemetry) {
        const modal = document.getElementById('debriefModal');
        if (!modal) return;

        const offset = telemetry.landingOffset || 0;
        const speed = telemetry.landingSpeed || 0;
        const fuelLeft = telemetry.fuel || 0;

        let score = 100;
        if (offset > 50) score -= 20;
        else if (offset > 10) score -= 10;
        if (speed > 5) score -= 30;
        else if (speed > 2) score -= 10;
        if (fuelLeft < 5) score -= 10;
        score = Math.max(0, score);

        const grade = score >= 90 ? 'PERFECT' : score >= 70 ? 'NOMINAL' : score >= 50 ? 'MARGINAL' : 'FAILED';
        const gradeColor = score >= 90 ? '#00ff88' : score >= 70 ? '#00d4ff' : score >= 50 ? '#ffa502' : '#ff4757';

        const gradeEl = document.getElementById('debriefGrade');
        const scoreEl = document.getElementById('debriefScore');
        const offsetEl = document.getElementById('debriefOffset');
        const speedEl = document.getElementById('debriefSpeed');
        const fuelEl = document.getElementById('debriefFuel');
        const timeEl = document.getElementById('debriefTime');

        if (gradeEl) { gradeEl.textContent = grade; gradeEl.style.color = gradeColor; }
        if (scoreEl) scoreEl.textContent = score + '/100';
        if (offsetEl) offsetEl.textContent = offset.toFixed(1) + ' m';
        if (speedEl) speedEl.textContent = speed.toFixed(2) + ' m/s';
        if (fuelEl) fuelEl.textContent = fuelLeft.toFixed(1) + '%';
        if (timeEl) timeEl.textContent = 'T+' + Math.floor(telemetry.time / 60).toString().padStart(2, '0') + ':' + Math.floor(telemetry.time % 60).toString().padStart(2, '0');

        modal.classList.add('visible');
    }

    // Unit toggle
    let useImperial = false;
    const unitToggle = document.getElementById('unitToggle');
    if (unitToggle) {
        unitToggle.addEventListener('click', () => {
            useImperial = !useImperial;
            unitToggle.textContent = useImperial ? 'Switch to Metric' : 'Switch to Imperial';
        });
    }

    // Phase timeline updater
    function updatePhaseTimeline() {
        const current = simulation.currentPhase;
        document.querySelectorAll('.timeline-step').forEach((step, i) => {
            step.classList.remove('active', 'completed');
            if (i < current) step.classList.add('completed');
            else if (i === current) step.classList.add('active');
        });
    }

    function updateSimulation(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        frameCount++;

        // Update simulation physics
        if (simulation.isRunning) {
            simulation.update(deltaTime);

            const telemetry = simulation.getTelemetry();

            // Update telemetry display
            updateTelemetryDisplay(telemetry);

            // Update charts (throttled)
            if (charts) charts.update(telemetry, frameCount);

            // Update mission events display
            updateMissionEvents();

            // Update phase timeline
            updatePhaseTimeline();

            // Check mission callouts
            checkCallouts(telemetry);

            // Detect simulation stopping (landing)
            if (wasRunning && !simulation.isRunning && simulation.currentPhase >= 8) {
                showLandingDebrief(simulation.getTelemetry());
            }
            wasRunning = simulation.isRunning;
        } else {
            wasRunning = false;
        }

        requestAnimationFrame(updateSimulation);
    }

    // Start the simulation loop
    requestAnimationFrame(updateSimulation);

    // UI Control Handlers
    const pauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedControl = document.getElementById('speedControl');
    const phaseSelect = document.getElementById('phaseSelect');
    const cameraViewBtns = document.querySelectorAll('[data-view]');

    // Pause/Play button
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (simulation.isRunning) {
                simulation.pause();
                pauseBtn.innerHTML = '<span class="icon">▶</span> Play';
            } else {
                simulation.start();
                pauseBtn.innerHTML = '<span class="icon">⏸</span> Pause';
            }
        });
    }

    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            simulation.reset();
            visualization.updateTrajectory([]);
            if (pauseBtn) pauseBtn.innerHTML = '<span class="icon">▶</span> Play';
            shownCallouts.clear();
            wasRunning = false;
            if (charts) charts.reset();
            updateTelemetryDisplay(simulation.getTelemetry());
            updateMissionEvents();
            updatePhaseTimeline();
            // Close debrief modal if open
            const modal = document.getElementById('debriefModal');
            if (modal) modal.classList.remove('visible');
        });
    }

    // Simulation speed control
    if (speedControl) {
        speedControl.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            simulation.setSimulationSpeed(speed);
            const speedValue = document.getElementById('speedValue');
            if (speedValue) {
                speedValue.textContent = speed.toFixed(1) + 'x';
            }
        });
    }

    // Jump to phase control
    if (phaseSelect) {
        phaseSelect.addEventListener('change', (e) => {
            const phaseIndex = parseInt(e.target.value);
            simulation.jumpToPhase(phaseIndex);
            updateTelemetryDisplay(simulation.getTelemetry());
        });
    }

    // Camera view controls
    cameraViewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            cameraViewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const viewName = btn.getAttribute('data-view');
            visualization.setCameraView(viewName);
        });
    });

    // Telemetry display update function
    function updateTelemetryDisplay(telemetry) {
        // Mission time
        const minutes = Math.floor(telemetry.time / 60);
        const seconds = Math.floor(telemetry.time % 60);
        document.getElementById('missionTime').textContent =
            `T+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Altitude
        const altEl = document.getElementById('altitude');
        if (altEl) {
            const altKm = telemetry.altitude / 1000;
            altEl.textContent = useImperial
                ? (altKm * 0.621371).toFixed(2) + ' mi'
                : altKm.toFixed(2) + ' km';
        }

        // Velocity
        const velEl = document.getElementById('velocity');
        if (velEl) {
            velEl.textContent = useImperial
                ? (telemetry.velocity * 2.23694).toFixed(0) + ' mph'
                : telemetry.velocity.toFixed(0) + ' m/s';
        }

        // Vertical Speed
        const vsEl = document.getElementById('verticalSpeed');
        if (vsEl) vsEl.textContent = telemetry.verticalSpeed.toFixed(0) + ' m/s';

        // Mass
        const massEl = document.getElementById('mass');
        if (massEl) massEl.textContent = (telemetry.mass / 1000).toFixed(1) + ' t';

        // Fuel
        const fuelEl = document.getElementById('fuel');
        if (fuelEl) fuelEl.textContent = telemetry.fuel.toFixed(1) + '%';
        const fuelBarEl = document.getElementById('fuelBar');
        if (fuelBarEl) fuelBarEl.style.width = telemetry.fuel + '%';

        // Thrust
        const thrustEl = document.getElementById('thrust');
        if (thrustEl) thrustEl.textContent = telemetry.thrust.toFixed(0) + ' kN';

        // Throttle
        const throttleEl = document.getElementById('throttle');
        if (throttleEl) throttleEl.textContent = telemetry.throttle.toFixed(0) + '%';

        // Pitch
        const pitchEl = document.getElementById('pitch');
        if (pitchEl) pitchEl.textContent = telemetry.pitch.toFixed(1) + '°';

        // Roll
        const rollEl = document.getElementById('roll');
        if (rollEl) rollEl.textContent = telemetry.roll.toFixed(1) + '°';

        // Yaw
        const yawEl = document.getElementById('yaw');
        if (yawEl) yawEl.textContent = telemetry.yaw.toFixed(1) + '°';

        // G-Force
        const gforceEl = document.getElementById('gforce');
        if (gforceEl) gforceEl.textContent = telemetry.gforce.toFixed(2) + 'g';

        // Distance to Target
        const distEl = document.getElementById('distance');
        if (distEl) distEl.textContent = (telemetry.distance / 1000).toFixed(2) + ' km';

        // Dynamic Pressure
        const dynEl = document.getElementById('dynPressure');
        if (dynEl) dynEl.textContent = telemetry.dynPressure.toFixed(1) + ' kPa';

        // Show MAX-Q badge once reached
        const maxQBadge = document.getElementById('maxQBadge');
        if (maxQBadge && telemetry.maxQReached) {
            maxQBadge.style.display = 'inline-block';
        }

        // Mach number
        const machEl = document.getElementById('mach');
        if (machEl) machEl.textContent = 'M' + telemetry.mach;
    }

    // Mission events display
    function updateMissionEvents() {
        const phaseIndicator = document.getElementById('phaseIndicator');
        if (phaseIndicator) {
            const phaseName = simulation.phases[simulation.currentPhase].name;
            phaseIndicator.textContent = phaseName.toUpperCase();
        }
    }

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                if (pauseBtn) pauseBtn.click();
                break;
            case 'r':
            case 'R':
                if (resetBtn) resetBtn.click();
                break;
            case '1':
                visualization.setCameraView('overview');
                break;
            case '2':
                visualization.setCameraView('chase');
                break;
            case '3':
                visualization.setCameraView('ground');
                break;
            case '4':
                visualization.setCameraView('orbital');
                break;
        }
    });

    // Initial UI state
    updateTelemetryDisplay(simulation.getTelemetry());
    updateMissionEvents();
    updatePhaseTimeline();

    console.log('Falcon 9 Simulation initialized!');
});
