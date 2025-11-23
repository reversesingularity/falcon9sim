// app.js - Main Application Controller (FIXED)

document.addEventListener('DOMContentLoaded', () => {
    // Initialize simulation and visualization
    const simulation = new Falcon9Simulation();
    const visualization = new Visualization('scene-canvas');
    
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
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedSlider = document.getElementById('speedSlider');
    const speedDisplay = document.getElementById('speedDisplay');
    const phaseSelect = document.getElementById('phaseSelect');
    const cameraViewBtns = document.querySelectorAll('.camera-btn');
    
    // Pause/Play button
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (simulation.isRunning) {
                simulation.pause();
                pauseBtn.textContent = '▶ PLAY';
                pauseBtn.classList.remove('pause');
                pauseBtn.classList.add('play');
            } else {
                simulation.start();
                pauseBtn.textContent = '⏸ PAUSE';
                pauseBtn.classList.remove('play');
                pauseBtn.classList.add('pause');
            }
        });
    }
    
    // Reset button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            simulation.reset();
            visualization.updateTrajectory([]);
            pauseBtn.textContent = '▶ PLAY';
            pauseBtn.classList.remove('pause');
            pauseBtn.classList.add('play');
            updateTelemetryDisplay(simulation.getTelemetry());
            updateMissionEvents();
        });
    }
    
    // Simulation speed control
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            simulation.setSimulationSpeed(speed);
            if (speedDisplay) {
                speedDisplay.textContent = speed.toFixed(1) + 'x';
            }
        });
    }
    
    // Jump to phase control
    if (phaseSelect) {
        // Populate phase options
        simulation.phases.forEach((phase, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = phase.name;
            phaseSelect.appendChild(option);
        });
        
        phaseSelect.addEventListener('change', (e) => {
            const phaseIndex = parseInt(e.target.value);
            simulation.jumpToPhase(phaseIndex);
            updateTelemetryDisplay(simulation.getTelemetry());
        });
    }
    
    // Camera view controls
    cameraViewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            cameraViewBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Set camera view
            const viewName = btn.dataset.view || btn.textContent.toLowerCase();
            visualization.setCameraView(viewName);
        });
    });
    
    // Telemetry display update function
    function updateTelemetryDisplay(telemetry) {
        const elements = {
            'mission-time': formatTime(telemetry.time),
            'altitude': (telemetry.altitude / 1000).toFixed(2) + ' km',
            'velocity': telemetry.velocity.toFixed(0) + ' m/s',
            'vertical-speed': telemetry.verticalSpeed.toFixed(0) + ' m/s',
            'mass': (telemetry.mass / 1000).toFixed(1) + ' t',
            'fuel': telemetry.fuel.toFixed(1) + '%',
            'thrust': telemetry.thrust.toFixed(0) + ' kN',
            'throttle': telemetry.throttle.toFixed(0) + '%',
            'pitch': telemetry.pitch.toFixed(1) + '°',
            'roll': telemetry.roll.toFixed(1) + '°',
            'yaw': telemetry.yaw.toFixed(1) + '°',
            'gforce': telemetry.gforce.toFixed(2) + 'g',
            'distance': (telemetry.distance / 1000).toFixed(2) + ' km',
            'dyn-pressure': telemetry.dynPressure.toFixed(1) + ' kPa',
            'phase-name': telemetry.phase
        };
        
        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                // Try class-based selection for telemetry items
                const classElement = document.querySelector(`.${id}`);
                if (classElement) {
                    classElement.textContent = value;
                }
            }
        }
    }
    
    // Mission events display
    function updateMissionEvents() {
        const eventsList = document.getElementById('mission-events');
        if (!eventsList) return;
        
        // Clear existing events
        eventsList.innerHTML = '';
        
        // Add phase history
        const currentPhase = simulation.currentPhase;
        const currentTime = simulation.time;
        
        for (let i = 0; i <= currentPhase && i < simulation.phases.length; i++) {
            const phase = simulation.phases[i];
            const li = document.createElement('li');
            li.className = i === currentPhase ? 'active' : 'completed';
            
            // Calculate phase start time
            let phaseStartTime = 0;
            for (let j = 0; j < i; j++) {
                phaseStartTime += simulation.phases[j].duration;
            }
            
            li.textContent = `T+${formatTime(phaseStartTime)}: ${phase.name}`;
            eventsList.appendChild(li);
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
            case '+':
            case '=':
                if (speedSlider) {
                    speedSlider.value = Math.min(10, parseFloat(speedSlider.value) + 0.5);
                    speedSlider.dispatchEvent(new Event('input'));
                }
                break;
            case '-':
            case '_':
                if (speedSlider) {
                    speedSlider.value = Math.max(0.1, parseFloat(speedSlider.value) - 0.5);
                    speedSlider.dispatchEvent(new Event('input'));
                }
                break;
        }
    });
    
    // Initial UI state
    updateTelemetryDisplay(simulation.getTelemetry());
    updateMissionEvents();
    
    // Log initialization success
    console.log('Falcon 9 Simulation initialized successfully!');
    console.log('Controls:');
    console.log('  Space: Play/Pause');
    console.log('  R: Reset');
    console.log('  1-4: Camera views');
    console.log('  +/-: Speed control');
    console.log('  Mouse: Rotate camera');
    console.log('  Scroll: Zoom');
});
