// Global State
const state = {
    isPaused: false,
    speedMultiplier: 1.0,
    showOrbits: true,
    showLabels: true,
    selectedObject: null,
    targetCameraPos: null,
    targetControlsLookAt: null,
    isTransitioningCamera: false
};

// Three.js Globals
let scene, camera, renderer, controls, raycaster, mouse;
let solarSystemGroup;
let sunMesh, sunLight;
let blackHoleGroup, blackHoleCoreMesh, accretionDiskMesh;
const planetObjects = [];
const asteroidObjects = [];
const labelElements = {};

// Astronomical Data Definitions (Including Pluto)
const PLANET_DATA = [
    {
        name: "Mercury",
        radius: 0.7,
        semiMajor: 12,
        semiMinor: 11.5,
        orbitSpeed: 0.03,
        rotationSpeed: 0.005,
        inclination: 0.08,
        type: "Terrestrial Planet",
        diameter: "4,879 km",
        distance: "57.9M km",
        period: "88 Days",
        rotPeriod: "58.6 Days",
        moons: 0,
        color: 0xa8a8a8
    },
    {
        name: "Venus",
        radius: 1.2,
        semiMajor: 18,
        semiMinor: 17.6,
        orbitSpeed: 0.02,
        rotationSpeed: -0.002,
        inclination: 0.05,
        type: "Terrestrial Planet",
        diameter: "12,104 km",
        distance: "108.2M km",
        period: "225 Days",
        rotPeriod: "243 Days",
        moons: 0,
        color: 0xe3bb76
    },
    {
        name: "Earth",
        radius: 1.3,
        semiMajor: 26,
        semiMinor: 25.2,
        orbitSpeed: 0.015,
        rotationSpeed: 0.01,
        inclination: 0.0,
        type: "Terrestrial Planet",
        diameter: "12,742 km",
        distance: "149.6M km",
        period: "365.25 Days",
        rotPeriod: "24 Hours",
        moons: 1,
        color: 0x2233ff
    },
    {
        name: "Mars",
        radius: 0.9,
        semiMajor: 34,
        semiMinor: 33.1,
        orbitSpeed: 0.01,
        rotationSpeed: 0.009,
        inclination: 0.03,
        type: "Terrestrial Planet",
        diameter: "6,779 km",
        distance: "227.9M km",
        period: "687 Days",
        rotPeriod: "24.6 Hours",
        moons: 2,
        color: 0xc1440e
    },
    {
        name: "Jupiter",
        radius: 3.2,
        semiMajor: 52,
        semiMinor: 50.5,
        orbitSpeed: 0.006,
        rotationSpeed: 0.02,
        inclination: 0.02,
        type: "Gas Giant",
        diameter: "139,820 km",
        distance: "778.5M km",
        period: "11.8 Years",
        rotPeriod: "9.9 Hours",
        moons: 79,
        color: 0xd8ca9d
    },
    {
        name: "Saturn",
        radius: 2.6,
        semiMajor: 68,
        semiMinor: 65.8,
        orbitSpeed: 0.004,
        rotationSpeed: 0.018,
        inclination: 0.04,
        type: "Gas Giant",
        diameter: "116,460 km",
        distance: "1.43B km",
        period: "29.5 Years",
        rotPeriod: "10.7 Hours",
        moons: 82,
        color: 0xe2bf7d,
        hasRings: true
    },
    {
        name: "Uranus",
        radius: 1.8,
        semiMajor: 84,
        semiMinor: 82.2,
        orbitSpeed: 0.0025,
        rotationSpeed: -0.012,
        inclination: 0.01,
        type: "Ice Giant",
        diameter: "50,724 km",
        distance: "2.87B km",
        period: "84 Years",
        rotPeriod: "17.2 Hours",
        moons: 27,
        color: 0x4b70dd,
        hasRings: true
    },
    {
        name: "Neptune",
        radius: 1.7,
        semiMajor: 98,
        semiMinor: 96.5,
        orbitSpeed: 0.0018,
        rotationSpeed: 0.014,
        inclination: 0.03,
        type: "Ice Giant",
        diameter: "49,244 km",
        distance: "4.50B km",
        period: "165 Years",
        rotPeriod: "16.1 Hours",
        moons: 14,
        color: 0x274687
    },
    {
        name: "Pluto",
        radius: 0.6,
        semiMajor: 112,
        semiMinor: 108.0,
        orbitSpeed: 0.0012,
        rotationSpeed: 0.008,
        inclination: 0.15,
        type: "Dwarf Planet",
        diameter: "2,377 km",
        distance: "5.90B km",
        period: "248 Years",
        rotPeriod: "6.4 Days",
        moons: 5,
        color: 0x968375
    }
];

window.addEventListener('DOMContentLoaded', () => {
    init();
    animate();
});

function init() {
    createScene();
    createCamera();
    createRenderer();
    createControls();
    createLights();
    createStarfield();

    solarSystemGroup = new THREE.Group();
    scene.add(solarSystemGroup);

    createSun();
    createPlanets();
    createAsteroidBelt();

    setupRaycaster();
    setupUI();
    window.addEventListener('resize', onWindowResize, false);
}

function createScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000005, 0.0008);
}

function createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2500);
    camera.position.set(0, 45, 90);
}

function createRenderer() {
    const container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
}

function createControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 600;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
}

function createLights() {
    const ambientLight = new THREE.AmbientLight(0x222233, 0.4);
    scene.add(ambientLight);

    sunLight = new THREE.PointLight(0xffffff, 3.0, 900, 0.4);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
}

function createProceduralTexture(type, baseColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const color = new THREE.Color(baseColorHex);
    const fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;

    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (type === 'sun') {
        const grad = ctx.createRadialGradient(256, 128, 10, 256, 128, 256);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#ffcc00');
        grad.addColorStop(1, '#ff3300');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (type === 'gas') {
        for (let y = 0; y < canvas.height; y += 4) {
            const noise = Math.sin(y * 0.08) * 40 + (Math.random() - 0.5) * 20;
            ctx.fillStyle = `rgba(${(color.r * 255) + noise}, ${(color.g * 255) + noise}, ${(color.b * 255) + noise}, 0.25)`;
            ctx.fillRect(0, y, canvas.width, 4);
        }
        if (baseColorHex === 0xd8ca9d) { // Jupiter Spot
            ctx.fillStyle = '#b33924';
            ctx.beginPath();
            ctx.ellipse(320, 160, 40, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'terrestrial' || type === 'pluto') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < 400; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const r = Math.random() * 6 + 1;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'earth') {
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#15803d';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const r = Math.random() * 50 + 15;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

function createStarfield() {
    const count = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const r = 500 + Math.random() * 700;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        const c = new THREE.Color();
        c.setHSL(0.55 + Math.random() * 0.25, 0.3, 0.7 + Math.random() * 0.3);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.85
    });

    const starfield = new THREE.Points(geometry, material);
    scene.add(starfield);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(4.5, 64, 64);
    const sunTexture = createProceduralTexture('sun', 0xffaa00);

    const sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,
        color: 0xffea00
    });

    sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.userData = {
        name: "Sun",
        type: "Yellow Dwarf Star",
        details: { diameter: "1,392,700 km", distance: "0 km", period: "Center", rotPeriod: "27 Days", moons: 0 }
    };
    solarSystemGroup.add(sunMesh);

    // Coronal Glow Layers
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(5.2, 32, 32), glowMat);
    sunMesh.add(glowMesh);

    createHTMLLabel("Sun");
}

function createPlanets() {
    PLANET_DATA.forEach((data) => {
        const orbitGroup = new THREE.Group();
        orbitGroup.rotation.x = data.inclination;
        orbitGroup.rotation.z = data.inclination * 0.5;
        solarSystemGroup.add(orbitGroup);

        const orbitLine = createOrbitLine(data.semiMajor, data.semiMinor);
        orbitGroup.add(orbitLine);

        const planetGeo = new THREE.SphereGeometry(data.radius, 32, 32);
        let texType = (data.name === 'Earth') ? 'earth' : ((data.name === 'Pluto') ? 'pluto' : (data.type.includes('Giant') ? 'gas' : 'terrestrial'));
        const planetTex = createProceduralTexture(texType, data.color);

        const planetMat = new THREE.MeshStandardMaterial({
            map: planetTex,
            roughness: 0.85,
            metalness: 0.1
        });

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.userData = { name: data.name, data: data };

        const initialAngle = Math.random() * Math.PI * 2;
        planetMesh.position.x = Math.cos(initialAngle) * data.semiMajor;
        planetMesh.position.z = Math.sin(initialAngle) * data.semiMinor;

        if (data.name === "Earth") {
            setupEarthSystem(planetMesh);
        } else if (data.hasRings) {
            setupRings(planetMesh, data);
        } else if (data.name === "Pluto") {
            createBlackHoleNearPluto(planetMesh);
        }

        orbitGroup.add(planetMesh);

        planetObjects.push({
            mesh: planetMesh,
            orbitGroup: orbitGroup,
            orbitLine: orbitLine,
            angle: initialAngle,
            data: data
        });

        createHTMLLabel(data.name);
    });
}

function createOrbitLine(semiMajor, semiMinor) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * semiMajor, 0, Math.sin(theta) * semiMinor));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18
    });
    return new THREE.LineLoop(geometry, material);
}

function createAsteroidBelt() {
    const asteroidCount = 650;
    const minRadius = 38;
    const maxRadius = 46;

    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x887766,
        roughness: 0.9,
        metalness: 0.2
    });

    for (let i = 0; i < asteroidCount; i++) {
        const size = Math.random() * 0.22 + 0.08;
        const geom = new THREE.DodecahedronGeometry(size, 1);

        // Deform vertices for irregular rocky stone meteor shapes
        const posAttr = geom.attributes.position;
        for (let j = 0; j < posAttr.count; j++) {
            const vx = posAttr.getX(j) + (Math.random() - 0.5) * 0.08;
            const vy = posAttr.getY(j) + (Math.random() - 0.5) * 0.08;
            const vz = posAttr.getZ(j) + (Math.random() - 0.5) * 0.08;
            posAttr.setXYZ(j, vx, vy, vz);
        }
        geom.computeVertexNormals();

        const asteroid = new THREE.Mesh(geom, stoneMaterial);

        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const angle = Math.random() * Math.PI * 2;
        const yOffset = (Math.random() - 0.5) * 2.5;

        asteroid.position.set(
            Math.cos(angle) * radius,
            yOffset,
            Math.sin(angle) * radius
        );

        asteroid.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        solarSystemGroup.add(asteroid);

        asteroidObjects.push({
            mesh: asteroid,
            angle: angle,
            radius: radius,
            speed: (0.005 + Math.random() * 0.004),
            rotSpeed: (Math.random() - 0.5) * 0.04
        });
    }
}

function createBlackHoleNearPluto(plutoMesh) {
    blackHoleGroup = new THREE.Group();
    blackHoleGroup.position.set(6.5, 2.0, 4.5);
    plutoMesh.add(blackHoleGroup);

    // 1. Black Hole Core (Event Horizon)
    const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    blackHoleCoreMesh = new THREE.Mesh(coreGeo, coreMat);
    blackHoleGroup.add(blackHoleCoreMesh);

    blackHoleCoreMesh.userData = {
        name: "Black Hole",
        data: {
            type: "Gravitational Singularity",
            diameter: "Event Horizon: ~10 km",
            distance: "Near Pluto System",
            period: "Pluto Orbit Companion",
            rotPeriod: "Relativistic",
            moons: "Gravitational Trap"
        }
    };

    // 2. Accretion Disk Ring
    const ringGeo = new THREE.RingGeometry(1.4, 3.8, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.2, 'rgba(236, 72, 153, 0.95)');
    grad.addColorStop(0.6, 'rgba(168, 85, 247, 0.85)');
    grad.addColorStop(0.85, 'rgba(59, 130, 246, 0.5)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);

    const ringTex = new THREE.CanvasTexture(canvas);
    const ringMat = new THREE.MeshBasicMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.95
    });

    accretionDiskMesh = new THREE.Mesh(ringGeo, ringMat);
    accretionDiskMesh.rotation.x = Math.PI / 2.5;
    blackHoleGroup.add(accretionDiskMesh);

    // 3. Gravitational Lensing Halo Glow
    const haloGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    blackHoleGroup.add(haloMesh);

    // 4. Purple Light Source
    const bhLight = new THREE.PointLight(0xa855f7, 2.2, 35);
    blackHoleGroup.add(bhLight);

    createHTMLLabel("Black Hole");
    if (labelElements["Black Hole"]) {
        labelElements["Black Hole"].classList.add('blackhole-label');
    }
}

function setupEarthSystem(earthMesh) {
    const moonOrbitGroup = new THREE.Group();
    earthMesh.add(moonOrbitGroup);

    const moonGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const moonTex = createProceduralTexture('terrestrial', 0xaaaaaa);
    const moonMat = new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.9 });

    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(2.8, 0, 0);
    moonMesh.userData = { name: "Moon", isMoon: true };

    moonOrbitGroup.add(moonMesh);

    earthMesh.userData.moonOrbitGroup = moonOrbitGroup;
    earthMesh.userData.moonMesh = moonMesh;
}

function setupRings(planetMesh, data) {
    const innerR = data.radius * 1.4;
    const outerR = data.radius * 2.5;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);

    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(210, 180, 140, 0.8)');
    grad.addColorStop(0.5, 'rgba(160, 130, 90, 0.2)');
    grad.addColorStop(0.8, 'rgba(210, 180, 140, 0.7)');
    grad.addColorStop(1, 'rgba(160, 130, 90, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);

    const ringTex = new THREE.CanvasTexture(canvas);
    const ringMat = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        roughness: 0.5
    });

    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    planetMesh.add(ringMesh);
}

function createHTMLLabel(name) {
    const container = document.getElementById('labels-container');
    const label = document.createElement('div');
    label.className = 'planet-label';
    label.innerText = name.toUpperCase();
    container.appendChild(label);
    labelElements[name] = label;
}

function updateLabels() {
    if (!state.showLabels) {
        Object.values(labelElements).forEach(el => el.style.display = 'none');
        return;
    }

    const tempV = new THREE.Vector3();

    if (sunMesh) {
        sunMesh.getWorldPosition(tempV);
        projectToScreen(tempV, labelElements["Sun"]);
    }

    planetObjects.forEach(obj => {
        obj.mesh.getWorldPosition(tempV);
        projectToScreen(tempV, labelElements[obj.data.name]);
    });

    if (blackHoleCoreMesh) {
        blackHoleCoreMesh.getWorldPosition(tempV);
        projectToScreen(tempV, labelElements["Black Hole"]);
    }
}

function projectToScreen(vector, element) {
    if (!element) return;

    vector.project(camera);

    if (vector.z > 1) {
        element.style.display = 'none';
        return;
    }

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

    element.style.display = 'block';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
}

function setupRaycaster() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('#ui-container') || e.target.closest('#info-panel')) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const clickableMeshes = [sunMesh, blackHoleCoreMesh, ...planetObjects.map(p => p.mesh)].filter(Boolean);
        const intersects = raycaster.intersectObjects(clickableMeshes, false);

        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            selectObject(hitObject);
        }
    });
}

function selectObject(mesh) {
    state.selectedObject = mesh;
    const data = mesh.userData.data || mesh.userData.details;
    const name = mesh.userData.name;

    document.getElementById('info-name').innerText = name;
    const typeBadge = document.getElementById('info-type');
    typeBadge.innerText = data.type || "Celestial Body";

    if (name === "Black Hole") {
        typeBadge.classList.add('badge-blackhole');
    } else {
        typeBadge.classList.remove('badge-blackhole');
    }

    document.getElementById('info-diameter').innerText = data.diameter;
    document.getElementById('info-distance').innerText = data.distance;
    document.getElementById('info-period').innerText = data.period;
    document.getElementById('info-rotation').innerText = data.rotPeriod;
    document.getElementById('info-moons').innerText = data.moons;

    document.getElementById('info-panel').classList.remove('hidden');

    const selectElem = document.getElementById('planet-select');
    selectElem.value = (name === "Black Hole") ? "BlackHole" : name;
}

function focusOnSelectedPlanet() {
    if (!state.selectedObject) return;

    const targetMesh = state.selectedObject;
    const worldPos = new THREE.Vector3();
    targetMesh.getWorldPosition(worldPos);

    const radius = targetMesh.geometry && targetMesh.geometry.parameters ? (targetMesh.geometry.parameters.radius || 3) : 2;
    const offset = new THREE.Vector3(radius * 4.0, radius * 2.5, radius * 4.0);

    state.targetControlsLookAt = worldPos.clone();
    state.targetCameraPos = worldPos.clone().add(offset);
    state.isTransitioningCamera = true;
}

function resetCameraPosition() {
    state.targetControlsLookAt = new THREE.Vector3(0, 0, 0);
    state.targetCameraPos = new THREE.Vector3(0, 45, 90);
    state.isTransitioningCamera = true;
}

function setupUI() {
    const playPauseBtn = document.getElementById('btn-play-pause');
    playPauseBtn.addEventListener('click', () => {
        state.isPaused = !state.isPaused;
        playPauseBtn.innerText = state.isPaused ? 'PLAY' : 'PAUSE';
        playPauseBtn.classList.toggle('active', !state.isPaused);
    });

    document.getElementById('btn-reset-sim').addEventListener('click', () => {
        planetObjects.forEach(p => { p.angle = Math.random() * Math.PI * 2; });
    });

    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-value');
    speedSlider.addEventListener('input', (e) => {
        state.speedMultiplier = parseFloat(e.target.value);
        speedVal.innerText = `${state.speedMultiplier.toFixed(2)}x`;
    });

    document.getElementById('chk-orbits').addEventListener('change', (e) => {
        state.showOrbits = e.target.checked;
        planetObjects.forEach(p => p.orbitLine.visible = state.showOrbits);
    });

    document.getElementById('chk-labels').addEventListener('change', (e) => {
        state.showLabels = e.target.checked;
    });

    document.getElementById('planet-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === "Sun") {
            selectObject(sunMesh);
        } else if (val === "BlackHole") {
            selectObject(blackHoleCoreMesh);
        } else {
            const found = planetObjects.find(p => p.data.name === val);
            if (found) selectObject(found.mesh);
        }
    });

    document.getElementById('btn-focus-planet').addEventListener('click', focusOnSelectedPlanet);
    document.getElementById('btn-reset-camera').addEventListener('click', resetCameraPosition);
    document.getElementById('btn-close-info').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (!state.isPaused) {
        updateSolarSystem();
    }

    updateCameraTransition();
    controls.update();
    updateLabels();

    renderer.render(scene, camera);
}

function updateSolarSystem() {
    // Sun Self-Rotation
    if (sunMesh) sunMesh.rotation.y += 0.002 * state.speedMultiplier;

    // Planets Orbital Motion & Self-Rotation
    planetObjects.forEach(obj => {
        obj.angle += obj.data.orbitSpeed * 0.05 * state.speedMultiplier;
        obj.mesh.position.x = Math.cos(obj.angle) * obj.data.semiMajor;
        obj.mesh.position.z = Math.sin(obj.angle) * obj.data.semiMinor;

        obj.mesh.rotation.y += obj.data.rotationSpeed * state.speedMultiplier;

        if (obj.data.name === "Earth" && obj.mesh.userData.moonOrbitGroup) {
            obj.mesh.userData.moonOrbitGroup.rotation.y += 0.03 * state.speedMultiplier;
            obj.mesh.userData.moonMesh.rotation.y += 0.01 * state.speedMultiplier;
        }
    });

    // Asteroid Belt (Meteors) Rotation
    asteroidObjects.forEach(ast => {
        ast.angle += ast.speed * 0.05 * state.speedMultiplier;
        ast.mesh.position.x = Math.cos(ast.angle) * ast.radius;
        ast.mesh.position.z = Math.sin(ast.angle) * ast.radius;
        ast.mesh.rotation.y += ast.rotSpeed * state.speedMultiplier;
    });

    // Black Hole Accretion Disk Rotation
    if (accretionDiskMesh) {
        accretionDiskMesh.rotation.z += 0.025 * state.speedMultiplier;
    }
}

function updateCameraTransition() {
    if (!state.isTransitioningCamera) return;

    camera.position.lerp(state.targetCameraPos, 0.05);
    controls.target.lerp(state.targetControlsLookAt, 0.05);

    if (camera.position.distanceTo(state.targetCameraPos) < 0.1) {
        state.isTransitioningCamera = false;
    }
}
