// visualization.js - Three.js 3D Visualization Engine

class Visualization {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.falcon9 = null;
        this.earth = null;
        this.trajectoryLine = null;
        this.exhaustParticles = [];
        this.stars = null;
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.rotationX = 0;
        this.rotationY = 0;
        this.cameraMode = 'chase'; // Default to third-person chase camera
        this.cameraDistance = 150; // Closer follow distance
        
        this.init();
        this.animate(); // START THE ANIMATION LOOP!
    }

    init() {
        // Scene setup with advanced atmospheric gradient
        this.scene = new THREE.Scene();
        
        // Create gradient sky dome
        const skyGeometry = new THREE.SphereGeometry(50000, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x000814) },
                bottomColor: { value: new THREE.Color(0x4da6ff) },
                offset: { value: 10 },
                exponent: { value: 0.4 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        this.skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyDome);
        
        this.scene.fog = new THREE.FogExp2(0x0a1628, 0.000015);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            70,
            this.canvas.parentElement.clientWidth / this.canvas.parentElement.clientHeight,
            0.1,
            100000
        );
        this.camera.position.set(300, 150, 300);
        this.camera.lookAt(0, 50, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(
            this.canvas.parentElement.clientWidth,
            this.canvas.parentElement.clientHeight
        );
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Simple manual controls
        this.setupMouseControls();

        // Lights
        this.setupLights();

        // Create scene objects
        this.createEarth();
        this.createFalcon9();
        this.createStarfield();
        this.createTrajectoryLine();
        this.createLaunchPad();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupMouseControls() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.mouseDown) {
                const deltaX = e.clientX - this.mouseX;
                const deltaY = e.clientY - this.mouseY;
                
                this.targetRotationY += deltaX * 0.005;
                this.targetRotationX += deltaY * 0.005;
                
                // Clamp vertical rotation
                this.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationX));
                
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouseDown = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * 0.5;
            this.cameraDistance += delta;
            this.cameraDistance = Math.max(100, Math.min(5000, this.cameraDistance));
        });
    }

    setupLights() {
        // Ambient light - subtle space ambience
        const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
        this.scene.add(ambientLight);

        // Directional light (sun) - warm daylight
        const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
        sunLight.position.set(1000, 1500, 800);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 8000;
        sunLight.shadow.camera.left = -500;
        sunLight.shadow.camera.right = 500;
        sunLight.shadow.camera.top = 500;
        sunLight.shadow.camera.bottom = -500;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);

        // Hemisphere light for sky/ground lighting
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c4e, 0.6);
        this.scene.add(hemiLight);

        // Point light for rocket (updated dynamically)
        this.rocketLight = new THREE.PointLight(0xff6600, 0, 100);
        this.scene.add(this.rocketLight);
    }

    createEarth() {
        // Create Earth sphere
        const earthGeometry = new THREE.SphereGeometry(6371, 64, 64); // Earth radius in km
        
        // Earth material with texture-like gradient
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a4d2e,
            emissive: 0x0a1f14,
            specular: 0x111111,
            shininess: 10,
            flatShading: false
        });

        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.receiveShadow = true;
        this.earth.position.set(0, -6371, 0); // Position so surface is at y=0
        this.scene.add(this.earth);

        // Add atmosphere glow
        const atmosphereGeometry = new THREE.SphereGeometry(6471, 64, 64);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        atmosphere.position.copy(this.earth.position);
        this.scene.add(atmosphere);

        // Add realistic ground plane at sea level
        const groundGeometry = new THREE.PlaneGeometry(5000, 5000, 100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5016,
            roughness: 0.9,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add subtle grid for reference
        const gridHelper = new THREE.GridHelper(2000, 80, 0x3a6622, 0x2d5016);
        gridHelper.position.y = 0.1;
        this.scene.add(gridHelper);
    }

    createFalcon9() {
        // Create Falcon 9 booster as a group (Y-up by default)
        this.falcon9 = new THREE.Group();

        // Main body - realistic white with SpaceX branding
        const bodyGeometry = new THREE.CylinderGeometry(1.83, 1.83, 40, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5f5,
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0x0a0a0a
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        this.falcon9.add(body);

        // Black interstage band
        const bandGeometry = new THREE.CylinderGeometry(1.84, 1.84, 3, 32);
        const bandMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a,
            metalness: 0.5,
            roughness: 0.3
        });
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.position.y = 5;
        band.castShadow = true;
        this.falcon9.add(band);

        // Nose cone - pointed up
        const coneGeometry = new THREE.ConeGeometry(1.83, 8, 32);
        const cone = new THREE.Mesh(coneGeometry, bodyMaterial);
        cone.position.y = 24;
        cone.castShadow = true;
        this.falcon9.add(cone);

        // Landing legs - carbon fiber look
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.12, 12, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.2
        });
        
        for (let i = 0; i < 4; i++) {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            const angle = (i * Math.PI) / 2;
            leg.position.x = Math.cos(angle) * 2.5;
            leg.position.z = Math.sin(angle) * 2.5;
            leg.position.y = -18;
            leg.rotation.z = Math.cos(angle) * 0.4;
            leg.rotation.x = Math.sin(angle) * 0.4;
            leg.castShadow = true;
            this.falcon9.add(leg);
        }

        // Grid fins - titanium look
        const finGeometry = new THREE.BoxGeometry(5, 0.3, 5);
        const finMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.1
        });
        
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            const angle = (i * Math.PI) / 2;
            fin.position.x = Math.cos(angle) * 3.5;
            fin.position.z = Math.sin(angle) * 3.5;
            fin.position.y = 8;
            fin.rotation.y = angle;
            fin.castShadow = true;
            this.falcon9.add(fin);
        }

        // Octaweb - engine section base
        const octawebGeometry = new THREE.CylinderGeometry(2.2, 2.2, 1, 8);
        const octawebMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a,
            metalness: 0.6,
            roughness: 0.4
        });
        const octaweb = new THREE.Mesh(octawebGeometry, octawebMaterial);
        octaweb.position.y = -20.5;
        octaweb.castShadow = true;
        this.falcon9.add(octaweb);

        // Store engine positions for exhaust effects
        this.enginePositions = [];

        // Engine nozzles - Merlin 1D engines
        const nozzleGeometry = new THREE.CylinderGeometry(0.6, 0.3, 2.5, 16);
        const nozzleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x000000
        });

        // Center engine
        const centerEngine = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        centerEngine.position.y = -22.5;
        centerEngine.castShadow = true;
        this.falcon9.add(centerEngine);
        this.enginePositions.push(new THREE.Vector3(0, -24, 0));

        // Ring of 8 engines
        for (let i = 0; i < 8; i++) {
            const engine = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            const angle = (i * Math.PI) / 4;
            const x = Math.cos(angle) * 1.8;
            const z = Math.sin(angle) * 1.8;
            engine.position.x = x;
            engine.position.z = z;
            engine.position.y = -22.5;
            engine.castShadow = true;
            this.falcon9.add(engine);
            this.enginePositions.push(new THREE.Vector3(x, -24, z));
        }

        // Add engine glow lights
        this.engineLights = [];
        for (let pos of this.enginePositions) {
            const light = new THREE.PointLight(0xff6600, 0, 50);
            light.position.copy(pos);
            this.falcon9.add(light);
            this.engineLights.push(light);
        }

        this.falcon9.position.set(0, 0, 0);
        this.scene.add(this.falcon9);
    }

    createStarfield() {
        // Create realistic starfield with varying sizes and brightness
        const starsGeometry = new THREE.BufferGeometry();
        
        const starsVertices = [];
        const starsSizes = [];
        const starsColors = [];
        
        for (let i = 0; i < 15000; i++) {
            // Distribute stars in a sphere
            const radius = 30000 + Math.random() * 50000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            starsVertices.push(x, y, z);
            
            // Varying star sizes for depth
            starsSizes.push(Math.random() * 3 + 0.5);
            
            // Slight color variations (white to blue-white)
            const color = new THREE.Color();
            color.setHSL(0.6, Math.random() * 0.2, 0.9 + Math.random() * 0.1);
            starsColors.push(color.r, color.g, color.b);
        }

        starsGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(starsVertices, 3)
        );
        starsGeometry.setAttribute('size',
            new THREE.Float32BufferAttribute(starsSizes, 1)
        );
        starsGeometry.setAttribute('color',
            new THREE.Float32BufferAttribute(starsColors, 3)
        );
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }

    createTrajectoryLine() {
        // Create line to show trajectory path
        const material = new THREE.LineBasicMaterial({ 
            color: 0x00ff88,
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        });
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(3000); // 1000 points max
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setDrawRange(0, 0);
        
        this.trajectoryLine = new THREE.Line(geometry, material);
        this.scene.add(this.trajectoryLine);
    }

    createLaunchPad() {
        // Create launch pad platform - rocket starts at y=40m (0.04km in our scale)
        const padGeometry = new THREE.CylinderGeometry(25, 25, 3, 32);
        const padMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x606060,
            roughness: 0.7,
            metalness: 0.3
        });
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        pad.position.y = 0.0385; // 38.5m center (pad surface at 40m)
        pad.receiveShadow = true;
        pad.castShadow = true;
        this.scene.add(pad);

        // Flame trench
        const trenchGeometry = new THREE.BoxGeometry(10, 2, 50);
        const trenchMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.1
        });
        const trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
        trench.position.y = 0.039;
        trench.receiveShadow = true;
        this.scene.add(trench);

        // Launch tower structures (realistic SpaceX style)
        const towerGeometry = new THREE.BoxGeometry(3, 60, 3);
        const towerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xcc3333,
            roughness: 0.5,
            metalness: 0.6
        });
        
        for (let i = 0; i < 4; i++) {
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            const angle = (i * Math.PI) / 2 + Math.PI / 4;
            tower.position.x = Math.cos(angle) * 35;
            tower.position.z = Math.sin(angle) * 35;
            tower.position.y = 0.030; // 30m center height
            tower.castShadow = true;
            tower.receiveShadow = true;
            this.scene.add(tower);

            // Cross beams
            if (i < 2) {
                const beamGeometry = new THREE.BoxGeometry(70, 2, 2);
                const beam = new THREE.Mesh(beamGeometry, towerMaterial);
                beam.position.y = 0.045; // 45m height
                beam.rotation.y = i * Math.PI / 2;
                beam.castShadow = true;
                this.scene.add(beam);
            }
        }
    }

    updateRocketPosition(position, rotation) {
        if (this.falcon9) {
            // Position in meters, convert to km for scale
            this.falcon9.position.set(
                position.x / 1000,
                position.y / 1000,
                position.z / 1000
            );

            // KSP-style rotation: pitch=0° means vertical (nose up), pitch=180° means engines down (landing)
            // In Three.js, the cylinder is Y-up by default
            // We need to rotate BACKWARDS so pitch=180° points nose UP with engines DOWN
            this.falcon9.rotation.set(
                0,                    // X-axis: no base rotation
                rotation.yaw,         // Y-axis: yaw (left/right)
                -rotation.pitch,      // Z-axis: NEGATIVE pitch (180° → nose up, engines down)
                'YZX'
            );

            // Update engine lights based on throttle
            if (this.engineLights && window.simulation) {
                const throttle = window.simulation.throttle;
                for (let light of this.engineLights) {
                    light.intensity = throttle * 2;
                    light.distance = 30 + throttle * 20;
                }
            }

            // Update light position
            if (this.rocketLight) {
                this.rocketLight.position.copy(this.falcon9.position);
            }
        }
    }

    updateTrajectory(points) {
        if (this.trajectoryLine && points.length > 0) {
            const positions = this.trajectoryLine.geometry.attributes.position.array;
            
            for (let i = 0; i < points.length && i < 1000; i++) {
                positions[i * 3] = points[i].x / 1000;
                positions[i * 3 + 1] = points[i].y / 1000;
                positions[i * 3 + 2] = points[i].z / 1000;
            }
            
            this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
            this.trajectoryLine.geometry.setDrawRange(0, Math.min(points.length, 1000));
        }
    }

    createExhaustEffect(intensity) {
        // Create realistic engine exhaust plumes
        if (intensity > 0.1 && this.falcon9 && this.enginePositions) {
            // Get rocket's rotation to determine exhaust direction
            const pitch = this.falcon9.rotation.z;
            const yaw = this.falcon9.rotation.y;
            
            // Exhaust direction (opposite of thrust)
            const exhaustDir = new THREE.Vector3(
                -Math.sin(pitch) * Math.cos(yaw),
                -Math.cos(pitch),
                Math.sin(pitch) * Math.sin(yaw)
            );

            // Create particles from each active engine
            const numEngines = intensity > 0.7 ? 9 : 3; // Use fewer engines at low throttle
            for (let i = 0; i < numEngines; i++) {
                // Spawn rate based on intensity
                if (Math.random() > 0.3) continue;

                const engineLocal = this.enginePositions[i].clone();
                const engineWorld = engineLocal.applyMatrix4(this.falcon9.matrixWorld);

                // Create exhaust particle
                const size = 0.8 + Math.random() * 0.6;
                const particleGeometry = new THREE.SphereGeometry(size, 8, 8);
                
                // Color gradient: orange-yellow-white core
                const colors = [0xff4400, 0xff6600, 0xff8800, 0xffaa00, 0xffcc88];
                const particleMaterial = new THREE.MeshBasicMaterial({ 
                    color: colors[Math.floor(Math.random() * colors.length)],
                    transparent: true,
                    opacity: 0.9
                });
                
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.copy(engineWorld);
                
                this.scene.add(particle);
                
                // Particle physics
                const spread = 0.3;
                const velocity = exhaustDir.clone().multiplyScalar(5 * intensity).add(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * spread,
                        (Math.random() - 0.5) * spread,
                        (Math.random() - 0.5) * spread
                    )
                );

                this.exhaustParticles.push({
                    mesh: particle,
                    life: 1.0,
                    velocity: velocity,
                    scale: size
                });
            }
        }

        // Update existing particles with realistic physics
        for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
            const particle = this.exhaustParticles[i];
            
            // Apply velocity
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(0.001));
            
            // Particle expansion and fade
            particle.life -= 0.015;
            particle.scale += 0.05;
            particle.mesh.scale.set(particle.scale, particle.scale, particle.scale);
            particle.mesh.material.opacity = particle.life * 0.7;
            
            // Gravity and air resistance
            particle.velocity.y -= 0.02;
            particle.velocity.multiplyScalar(0.98);
            
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                particle.mesh.material.dispose();
                this.exhaustParticles.splice(i, 1);
            }
        }
        
        // Limit particles for performance
        while (this.exhaustParticles.length > 500) {
            const old = this.exhaustParticles.shift();
            this.scene.remove(old.mesh);
            old.mesh.geometry.dispose();
            old.mesh.material.dispose();
        }
    }

    setCameraView(viewName) {
        switch(viewName) {
            case 'overview':
                this.camera.position.set(500, 300, 500);
                this.camera.lookAt(0, 100, 0);
                break;
            case 'chase':
                if (this.falcon9) {
                    const pos = this.falcon9.position;
                    this.camera.position.set(pos.x - 50, pos.y + 20, pos.z - 50);
                    this.camera.lookAt(pos.x, pos.y, pos.z);
                }
                break;
            case 'ground':
                this.camera.position.set(100, 10, 100);
                this.camera.lookAt(0, 50, 0);
                break;
            case 'orbit':
                this.camera.position.set(0, 2000, 0);
                this.camera.lookAt(0, 0, 0);
                break;
        }
    }

    setCameraView(viewName) {
        this.cameraMode = viewName;
        switch(viewName) {
            case 'overview':
                this.targetRotationX = 0.3;
                this.targetRotationY = 0.785;
                this.cameraDistance = 500;
                break;
            case 'chase':
                // Chase mode will update in updateCamera
                this.cameraDistance = 100;
                break;
            case 'ground':
                this.targetRotationX = 0.1;
                this.targetRotationY = 0.785;
                this.cameraDistance = 200;
                break;
            case 'orbital':
                this.targetRotationX = 1.2;
                this.targetRotationY = 0;
                this.cameraDistance = 2000;
                break;
        }
    }

    updateCamera() {
        // Smooth camera rotation
        this.rotationX += (this.targetRotationX - this.rotationX) * 0.05;
        this.rotationY += (this.targetRotationY - this.rotationY) * 0.05;
        
        if (this.cameraMode === 'chase' && this.falcon9) {
            // Third-person chase camera - follow behind and above the rocket
            const rocketPos = this.falcon9.position.clone();
            
            // Calculate camera offset based on rocket rotation for dynamic following
            const pitch = this.falcon9.rotation.z;
            const distance = this.cameraDistance / 1000; // Convert to km scale
            
            // Position camera behind and to the side for better view
            const offset = new THREE.Vector3(
                distance * 0.7 * Math.cos(this.rotationY),
                distance * 0.4, // Always slightly above
                distance * 0.7 * Math.sin(this.rotationY)
            );
            
            const targetPos = rocketPos.clone().add(offset);
            
            // Smooth camera movement
            this.camera.position.lerp(targetPos, 0.08);
            
            // Look slightly ahead of the rocket
            const lookAhead = new THREE.Vector3(0, rocketPos.y * 0.2, 0);
            this.camera.lookAt(rocketPos.add(lookAhead));
        } else {
            // Manual camera control
            const lookAtHeight = this.falcon9 ? this.falcon9.position.y * 1000 : 50;
            const radius = this.cameraDistance;
            
            this.camera.position.x = radius * Math.sin(this.rotationY) * Math.cos(this.rotationX);
            this.camera.position.y = Math.max(10, 150 + radius * Math.sin(this.rotationX));
            this.camera.position.z = radius * Math.cos(this.rotationY) * Math.cos(this.rotationX);
            
            this.camera.lookAt(0, Math.min(lookAtHeight, 100), 0);
        }
    }

    onWindowResize() {
        const width = this.canvas.parentElement.clientWidth;
        const height = this.canvas.parentElement.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    render() {
        this.updateCamera();
        
        // Update exhaust effect if simulation is running
        if (window.simulation && window.simulation.isRunning) {
            this.createExhaustEffect(window.simulation.throttle);
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update from simulation if it exists
        if (window.simulation) {
            const telemetry = window.simulation.getTelemetry();
            this.updateRocketPosition(telemetry.position, telemetry.rotation);
            this.updateTrajectory(window.simulation.trajectoryPoints);
        }
        
        this.render();
    }
}

// Export for use in app.js
window.Visualization = Visualization;
