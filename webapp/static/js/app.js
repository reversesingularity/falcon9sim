// app.js - Main Application Controller (FIXED)

document.addEventListener('DOMContentLoaded', () => {
    // Initialize simulation and visualization
    const simulation = new Falcon9Simulation();
    const visualization = new Visualization('canvas3d');
    
    // Make simulation globally accessible for visualization
    window.simulation = simulation;
    
    // Animation loop
    let lastTime = 0;
    
    function updateSimulation(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;
        
        // Update simulation physics
        if (simulation.isRunning) {
            simulation.update(deltaTime);
            
            // Update telemetry display
            updateTelemetryDisplay(simulation.getTelemetry());
            
            // Update mission events display
            updateMissionEvents();
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
            updateTelemetryDisplay(simulation.getTelemetry());
            updateMissionEvents();
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
        document.getElementById('altitude').textContent = 
            (telemetry.altitude / 1000).toFixed(2) + ' km';

        // Velocity
        document.getElementById('velocity').textContent = 
            telemetry.velocity.toFixed(0) + ' m/s';

        // Vertical Speed
        const verticalSpeed = telemetry.verticalSpeed;
        document.getElementById('verticalSpeed').textContent = 
            verticalSpeed.toFixed(0) + ' m/s';

        // Mass
        document.getElementById('mass').textContent = 
            (telemetry.mass / 1000).toFixed(1) + ' t';

        // Fuel
        document.getElementById('fuel').textContent = 
            telemetry.fuel.toFixed(1) + '%';
        document.getElementById('fuelBar').style.width = telemetry.fuel + '%';

        // Thrust
        document.getElementById('thrust').textContent = 
            telemetry.thrust.toFixed(0) + ' kN';

        // Throttle
        document.getElementById('throttle').textContent = 
            telemetry.throttle.toFixed(0) + '%';

        // Pitch
        document.getElementById('pitch').textContent = 
            telemetry.pitch.toFixed(1) + '°';

        // Roll
        document.getElementById('roll').textContent = 
            telemetry.roll.toFixed(1) + '°';

        // Yaw
        document.getElementById('yaw').textContent = 
            telemetry.yaw.toFixed(1) + '°';

        // G-Force
        document.getElementById('gforce').textContent = 
            telemetry.gforce.toFixed(2) + 'g';

        // Distance to Target
        document.getElementById('distance').textContent = 
            (telemetry.distance / 1000).toFixed(2) + ' km';

        // Dynamic Pressure
        document.getElementById('dynPressure').textContent = 
            telemetry.dynPressure.toFixed(1) + ' kPa';
    }

    // Mission events display
    function updateMissionEvents() {
        const phaseIndicator = document.getElementById('phaseIndicator');
        if (phaseIndicator) {
            const phaseName = simulation.phases[simulation.currentPhase].name;
            phaseIndicator.textContent = phaseName.toUpperCase();
        }
    }
    
    // Time formatting helper
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
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
    
    console.log('Falcon 9 Simulation initialized!');
});
