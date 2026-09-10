import * as THREE from 'three';

export interface StationSensorsStatus {
  temperatureStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  pressureStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  humidityStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  windSpeedStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  windDirectionStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  solarStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
  loggerStatus: 'Healthy' | 'Warning' | 'Critical' | 'Offline';
}

export interface AWSModelRefs {
  group: THREE.Group;
  anemometerRotor: THREE.Group;
  windVaneRotor: THREE.Group;
  tempShieldMesh: THREE.Mesh;
  tempGlowLight: THREE.PointLight;
  tempGlowMesh: THREE.Mesh;
  pressShieldMesh: THREE.Mesh;
  solarPanelMesh: THREE.Mesh;
  enclosureMesh: THREE.Mesh;
  sensorAnchorPoints: Record<string, THREE.Vector3>;
  explodedObjects: Array<{
    object: THREE.Object3D;
    initialPos: THREE.Vector3;
    explodedOffset: THREE.Vector3;
  }>;
  materials: {
    tempShield: THREE.MeshStandardMaterial;
    pressShield: THREE.MeshStandardMaterial;
    tempGlow: THREE.MeshBasicMaterial;
    stainlessSteel: THREE.MeshStandardMaterial;
    anodizedBlack: THREE.MeshStandardMaterial;
    enclosure: THREE.MeshStandardMaterial;
    solarPanel: THREE.MeshStandardMaterial;
  };
}

/**
 * Creates dynamic canvas texture for the AWSense data logger enclosure front door
 */
function createAWSenseLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Weatherproof white enclosure background
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, 512, 512);

    // Bevel border line
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, 464, 464);

    // AWSense Brand Logo
    // Orange cloud arc icon
    ctx.beginPath();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 14;
    ctx.arc(256, 210, 56, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();

    // "AWSense" text
    ctx.fillStyle = '#12355B';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AWSense', 256, 275);

    // Tagline text
    ctx.fillStyle = '#64748B';
    ctx.font = '600 20px sans-serif';
    ctx.fillText('METEOROLOGICAL AWS DATA LOGGER', 256, 325);

    // Specs subtext
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 16px monospace';
    ctx.fillText('IP67 SEALED | SIH26073 SYNOPTIC NODE', 256, 360);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates dynamic canvas texture for high-efficiency solar photovoltaic cells
 */
function createSolarPanelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Deep monocrystalline dark blue background
    ctx.fillStyle = '#0F2547';
    ctx.fillRect(0, 0, 512, 512);

    // Cell borders (6x4 grid)
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 4;
    const cols = 6;
    const rows = 4;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, 512);
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellH);
      ctx.lineTo(512, j * cellH);
      ctx.stroke();
    }

    // Busbars and silver collector lines
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Individual cell wafer corner chamfers
        ctx.fillStyle = '#172554';
        ctx.fillRect(c * cellW + 4, r * cellH + 4, cellW - 8, cellH - 8);

        // Thin collector grid lines
        for (let l = 1; l < 8; l++) {
          ctx.beginPath();
          ctx.moveTo(c * cellW + 4, r * cellH + (cellH * l) / 8);
          ctx.lineTo(c * cellW + cellW - 4, r * cellH + (cellH * l) / 8);
          ctx.stroke();
        }
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds the complete high-fidelity 3D model of the Automatic Weather Station
 * Matching reference image: media_1789063855542.jpg & media_1789063855532.jpg
 */
export function createAWSStationModel(): AWSModelRefs {
  const root = new THREE.Group();
  root.name = 'AWS_Station_Root';

  const explodedObjects: AWSModelRefs['explodedObjects'] = [];
  const sensorAnchorPoints: Record<string, THREE.Vector3> = {};

  // =========================================================================
  // PBR MATERIALS
  // =========================================================================
  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: '#8A8F98',
    roughness: 0.92,
    metalness: 0.05,
    name: 'Concrete'
  });

  const basePlateMaterial = new THREE.MeshStandardMaterial({
    color: '#64748B',
    roughness: 0.45,
    metalness: 0.85,
    name: 'BasePlate'
  });

  const stainlessSteel = new THREE.MeshStandardMaterial({
    color: '#D8DEE4',
    roughness: 0.22,
    metalness: 0.92,
    name: 'StainlessSteel'
  });

  const anodizedBlack = new THREE.MeshStandardMaterial({
    color: '#1C1F24',
    roughness: 0.38,
    metalness: 0.75,
    name: 'AnodizedBlack'
  });

  const enclosureMaterial = new THREE.MeshStandardMaterial({
    color: '#F4F6F8',
    roughness: 0.35,
    metalness: 0.15,
    name: 'Enclosure'
  });

  const solarPanelMaterial = new THREE.MeshStandardMaterial({
    map: createSolarPanelTexture(),
    roughness: 0.15,
    metalness: 0.55,
    name: 'SolarPanelSurface'
  });

  const solarFrameMaterial = new THREE.MeshStandardMaterial({
    color: '#CBD5E1',
    roughness: 0.3,
    metalness: 0.9,
    name: 'SolarFrame'
  });

  const tempShieldMaterial = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.25,
    metalness: 0.1,
    name: 'TempRadiationShield'
  });

  const pressShieldMaterial = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.3,
    metalness: 0.65,
    name: 'PressureShield'
  });

  const conduitCableMaterial = new THREE.MeshStandardMaterial({
    color: '#181A1D',
    roughness: 0.85,
    metalness: 0.1,
    name: 'ConduitCable'
  });

  // Pulsating anomaly glow material (starts non-emissive by default)
  const tempGlowMaterial = new THREE.MeshBasicMaterial({
    color: '#EF4444',
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    name: 'TempAnomalyGlow'
  });

  // =========================================================================
  // 1. CONCRETE MOUNTING BASE & STEEL GUSSETS
  // =========================================================================
  const baseGroup = new THREE.Group();
  baseGroup.name = 'Base_Group';

  // Concrete Plinth (1.1m x 1.1m x 0.35m)
  const concreteGeo = new THREE.BoxGeometry(1.15, 0.35, 1.15);
  const concreteMesh = new THREE.Mesh(concreteGeo, concreteMaterial);
  concreteMesh.position.y = -1.35;
  concreteMesh.castShadow = true;
  concreteMesh.receiveShadow = true;
  baseGroup.add(concreteMesh);

  // Steel Base Plate (0.36m x 0.36m x 0.025m)
  const basePlateGeo = new THREE.BoxGeometry(0.38, 0.025, 0.38);
  const basePlateMesh = new THREE.Mesh(basePlateGeo, basePlateMaterial);
  basePlateMesh.position.y = -1.165;
  basePlateMesh.castShadow = true;
  baseGroup.add(basePlateMesh);

  // 4 Triangular Gusset Stiffeners
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const gussetShape = new THREE.Shape();
    gussetShape.moveTo(0, 0);
    gussetShape.lineTo(0.12, 0);
    gussetShape.lineTo(0, 0.18);
    gussetShape.closePath();

    const extrudeSettings = { depth: 0.012, bevelEnabled: false };
    const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, extrudeSettings);
    const gussetMesh = new THREE.Mesh(gussetGeo, basePlateMaterial);
    gussetMesh.rotation.y = angle;
    gussetMesh.position.set(0, -1.15, 0);
    baseGroup.add(gussetMesh);

    // Anchor Bolt hex nuts
    const boltGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.04, 6);
    const boltMesh = new THREE.Mesh(boltGeo, basePlateMaterial);
    const boltDist = 0.14;
    boltMesh.position.set(
      Math.cos(angle + Math.PI / 4) * boltDist,
      -1.14,
      Math.sin(angle + Math.PI / 4) * boltDist
    );
    baseGroup.add(boltMesh);
  }
  root.add(baseGroup);

  explodedObjects.push({
    object: baseGroup,
    initialPos: baseGroup.position.clone(),
    explodedOffset: new THREE.Vector3(0, -0.4, 0)
  });

  // =========================================================================
  // 2. MAIN VERTICAL TUBULAR MAST
  // =========================================================================
  const mastGroup = new THREE.Group();
  mastGroup.name = 'Mast_Group';

  // Central Stainless Steel Mast (Length: 3.5m, Diameter: 9cm)
  const mastGeo = new THREE.CylinderGeometry(0.045, 0.045, 3.5, 32);
  const mastMesh = new THREE.Mesh(mastGeo, stainlessSteel);
  mastMesh.position.y = 0.6;
  mastMesh.castShadow = true;
  mastMesh.receiveShadow = true;
  mastGroup.add(mastMesh);

  // Decorative clamp collars
  const collarGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.05, 24);
  const collar1 = new THREE.Mesh(collarGeo, basePlateMaterial);
  collar1.position.y = 1.15;
  mastGroup.add(collar1);

  const collar2 = new THREE.Mesh(collarGeo, basePlateMaterial);
  collar2.position.y = 2.05;
  mastGroup.add(collar2);

  root.add(mastGroup);

  // =========================================================================
  // 3. WEATHERPROOF DATA LOGGER ENCLOSURE
  // =========================================================================
  const enclosureGroup = new THREE.Group();
  enclosureGroup.name = 'Enclosure_Group';
  enclosureGroup.position.set(0.06, 0.35, 0.08);

  // Main Cabinet Box (Width: 0.44m, Height: 0.50m, Depth: 0.26m)
  const boxGeo = new THREE.BoxGeometry(0.44, 0.50, 0.26);
  const enclosureMesh = new THREE.Mesh(boxGeo, enclosureMaterial);
  enclosureMesh.castShadow = true;
  enclosureMesh.receiveShadow = true;
  enclosureGroup.add(enclosureMesh);

  // Front Door with AWSense Logo Plate
  const doorGeo = new THREE.PlaneGeometry(0.42, 0.48);
  const doorMat = new THREE.MeshStandardMaterial({
    map: createAWSenseLogoTexture(),
    roughness: 0.3,
    metalness: 0.1
  });
  const doorMesh = new THREE.Mesh(doorGeo, doorMat);
  doorMesh.position.set(0, 0, 0.132);
  enclosureGroup.add(doorMesh);

  // Stainless Steel Side Latches
  const latchGeo = new THREE.BoxGeometry(0.015, 0.045, 0.03);
  const latch1 = new THREE.Mesh(latchGeo, stainlessSteel);
  latch1.position.set(0.225, 0.12, 0.06);
  enclosureGroup.add(latch1);

  const latch2 = new THREE.Mesh(latchGeo, stainlessSteel);
  latch2.position.set(0.225, -0.12, 0.06);
  enclosureGroup.add(latch2);

  // Rear U-Bolt Clamps connecting enclosure to the mast
  for (const clampY of [0.15, -0.15]) {
    const clampGeo = new THREE.TorusGeometry(0.055, 0.01, 12, 24, Math.PI);
    const clampMesh = new THREE.Mesh(clampGeo, basePlateMaterial);
    clampMesh.rotation.x = Math.PI / 2;
    clampMesh.rotation.z = Math.PI / 2;
    clampMesh.position.set(-0.06, clampY, -0.13);
    enclosureGroup.add(clampMesh);
  }

  // 5 Bottom Cable Glands (Conduit Entries)
  for (let i = 0; i < 5; i++) {
    const glandGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.045, 12);
    const glandMesh = new THREE.Mesh(glandGeo, anodizedBlack);
    glandMesh.position.set(-0.14 + i * 0.07, -0.265, 0.02);
    enclosureGroup.add(glandMesh);
  }

  root.add(enclosureGroup);

  explodedObjects.push({
    object: enclosureGroup,
    initialPos: enclosureGroup.position.clone(),
    explodedOffset: new THREE.Vector3(0.35, 0, 0.55)
  });

  sensorAnchorPoints['data_logger'] = new THREE.Vector3(0.06, 0.42, 0.28);

  // =========================================================================
  // 4. SOLAR PHOTOVOLTAIC PANEL
  // =========================================================================
  const solarGroup = new THREE.Group();
  solarGroup.name = 'Solar_Group';
  solarGroup.position.set(-0.55, 0.08, 0.22);

  // Tilt panel ~35 degrees towards sun
  solarGroup.rotation.x = 0.42;
  solarGroup.rotation.y = 0.28;

  // Aluminum Perimeter Frame
  const frameGeo = new THREE.BoxGeometry(0.68, 0.52, 0.035);
  const frameMesh = new THREE.Mesh(frameGeo, solarFrameMaterial);
  frameMesh.castShadow = true;
  solarGroup.add(frameMesh);

  // Photovoltaic Cell Surface
  const pvGeo = new THREE.PlaneGeometry(0.64, 0.48);
  const solarPanelMesh = new THREE.Mesh(pvGeo, solarPanelMaterial);
  solarPanelMesh.position.z = 0.019;
  solarGroup.add(solarPanelMesh);

  // Diagonal support strut connecting panel back to mast
  const strutGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.65, 12);
  const strutMesh = new THREE.Mesh(strutGeo, solarFrameMaterial);
  strutMesh.position.set(0.2, -0.18, -0.22);
  strutMesh.rotation.x = -0.55;
  strutMesh.rotation.z = -0.3;
  solarGroup.add(strutMesh);

  root.add(solarGroup);

  explodedObjects.push({
    object: solarGroup,
    initialPos: solarGroup.position.clone(),
    explodedOffset: new THREE.Vector3(-0.6, 0.1, 0.6)
  });

  sensorAnchorPoints['solar_panel'] = new THREE.Vector3(-0.55, 0.18, 0.32);

  // =========================================================================
  // 5. MIDDLE SENSOR CROSSBAR (TEMP & PRESSURE BRACKET)
  // =========================================================================
  const midArmGroup = new THREE.Group();
  midArmGroup.name = 'MidCrossbar_Group';
  midArmGroup.position.set(0, 1.15, 0);

  // Horizontal Cross Tube (Length: 1.45m)
  const crossArmGeo = new THREE.CylinderGeometry(0.024, 0.024, 1.45, 24);
  const crossArmMesh = new THREE.Mesh(crossArmGeo, stainlessSteel);
  crossArmMesh.rotation.z = Math.PI / 2;
  crossArmMesh.castShadow = true;
  midArmGroup.add(crossArmMesh);

  // --- A. LEFT: TEMPERATURE & RELATIVE HUMIDITY SENSOR (RADIATION SHIELD) ---
  const tempShieldGroup = new THREE.Group();
  tempShieldGroup.name = 'TempShield_Group';
  tempShieldGroup.position.set(-0.66, 0, 0);

  // Multi-Plate Gill Solar Radiation Shield (10 louvered plates)
  const shieldMeshGroup = new THREE.Group();
  const plateCount = 10;
  for (let i = 0; i < plateCount; i++) {
    // Louvered curved conical plate
    const plateGeo = new THREE.CylinderGeometry(0.12, 0.09, 0.018, 32);
    const plateMesh = new THREE.Mesh(plateGeo, tempShieldMaterial);
    plateMesh.position.y = (i - plateCount / 2) * 0.028;
    plateMesh.castShadow = true;
    shieldMeshGroup.add(plateMesh);
  }

  // Top Dome Cap
  const capGeo = new THREE.SphereGeometry(0.125, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const capMesh = new THREE.Mesh(capGeo, tempShieldMaterial);
  capMesh.position.y = plateCount * 0.014;
  shieldMeshGroup.add(capMesh);

  // Internal Sensor Cylinder inside the shield
  const sensorCoreGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.28, 16);
  const sensorCoreMesh = new THREE.Mesh(sensorCoreGeo, anodizedBlack);
  shieldMeshGroup.add(sensorCoreMesh);

  // Representative temp shield mesh reference
  const tempShieldMesh = capMesh;
  tempShieldGroup.add(shieldMeshGroup);

  // Physical Anomaly Glow (PointLight & Soft Aura Mesh attached to shield)
  const tempGlowLight = new THREE.PointLight('#EF4444', 0.0, 1.8, 2.0);
  tempGlowLight.position.set(0, 0, 0);
  tempShieldGroup.add(tempGlowLight);

  const glowSphereGeo = new THREE.SphereGeometry(0.24, 24, 24);
  const tempGlowMesh = new THREE.Mesh(glowSphereGeo, tempGlowMaterial);
  tempGlowMesh.position.set(0, 0, 0);
  tempShieldGroup.add(tempGlowMesh);

  // Bottom mount clamp
  const clampMountGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.12, 16);
  const clampMountMesh = new THREE.Mesh(clampMountGeo, stainlessSteel);
  clampMountMesh.position.y = -0.22;
  tempShieldGroup.add(clampMountMesh);

  midArmGroup.add(tempShieldGroup);

  sensorAnchorPoints['temperature'] = new THREE.Vector3(-0.66, 1.25, 0.1);
  sensorAnchorPoints['humidity'] = new THREE.Vector3(-0.66, 1.05, 0.1);

  // --- B. RIGHT: BAROMETRIC PRESSURE SENSOR SHIELD ---
  const pressShieldGroup = new THREE.Group();
  pressShieldGroup.name = 'PressureShield_Group';
  pressShieldGroup.position.set(0.66, 0, 0);

  // Compact Multi-Plate Barometer Housing (6 plates)
  const pressShieldMeshGroup = new THREE.Group();
  const pressPlateCount = 6;
  for (let i = 0; i < pressPlateCount; i++) {
    const pGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.016, 24);
    const pMesh = new THREE.Mesh(pGeo, pressShieldMaterial);
    pMesh.position.y = (i - pressPlateCount / 2) * 0.025;
    pMesh.castShadow = true;
    pressShieldMeshGroup.add(pMesh);
  }

  // Top Cap
  const pCapGeo = new THREE.CylinderGeometry(0.082, 0.082, 0.012, 24);
  const pCapMesh = new THREE.Mesh(pCapGeo, pressShieldMaterial);
  pCapMesh.position.y = pressPlateCount * 0.0125 + 0.006;
  pressShieldMeshGroup.add(pCapMesh);

  const pressShieldMesh = pCapMesh;
  pressShieldGroup.add(pressShieldMeshGroup);

  // Bottom mount clamp
  const pClampGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 16);
  const pClampMesh = new THREE.Mesh(pClampGeo, stainlessSteel);
  pClampMesh.position.y = -0.16;
  pressShieldGroup.add(pClampMesh);

  midArmGroup.add(pressShieldGroup);

  sensorAnchorPoints['pressure'] = new THREE.Vector3(0.66, 1.2, 0.1);

  root.add(midArmGroup);

  explodedObjects.push({
    object: tempShieldGroup,
    initialPos: tempShieldGroup.position.clone(),
    explodedOffset: new THREE.Vector3(-0.55, 0, 0)
  });

  explodedObjects.push({
    object: pressShieldGroup,
    initialPos: pressShieldGroup.position.clone(),
    explodedOffset: new THREE.Vector3(0.55, 0, 0)
  });

  // =========================================================================
  // 6. UPPER SENSOR CROSSBAR (ANEMOMETER & WIND VANE)
  // =========================================================================
  const upperArmGroup = new THREE.Group();
  upperArmGroup.name = 'UpperCrossbar_Group';
  upperArmGroup.position.set(0, 2.05, 0);

  // Horizontal Cross Tube (Length: 1.25m)
  const upperTubeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.25, 24);
  const upperTubeMesh = new THREE.Mesh(upperTubeGeo, stainlessSteel);
  upperTubeMesh.rotation.z = Math.PI / 2;
  upperTubeMesh.castShadow = true;
  upperArmGroup.add(upperTubeMesh);

  // --- A. LEFT: WIND SPEED SENSOR / ANEMOMETER (CONTINUOUS ROTATION) ---
  const anemometerGroup = new THREE.Group();
  anemometerGroup.name = 'Anemometer_Group';
  anemometerGroup.position.set(-0.54, 0, 0);

  // Stationary Mounting Post & Bearing Stem
  const anemoPostGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.26, 16);
  const anemoPostMesh = new THREE.Mesh(anemoPostGeo, anodizedBlack);
  anemoPostMesh.position.y = 0.13;
  anemoPostMesh.castShadow = true;
  anemometerGroup.add(anemoPostMesh);

  // ROTATING 3-CUP ASSEMBLY
  const anemometerRotor = new THREE.Group();
  anemometerRotor.name = 'Anemometer_Rotor';
  anemometerRotor.position.set(0, 0.26, 0);

  // Central Spindle Hub
  const anemoHubGeo = new THREE.CylinderGeometry(0.032, 0.026, 0.035, 24);
  const anemoHubMesh = new THREE.Mesh(anemoHubGeo, anodizedBlack);
  anemometerRotor.add(anemoHubMesh);

  // Top Spindle Cap
  const hubCapGeo = new THREE.SphereGeometry(0.026, 16, 12);
  const hubCapMesh = new THREE.Mesh(hubCapGeo, anodizedBlack);
  hubCapMesh.position.y = 0.018;
  anemometerRotor.add(hubCapMesh);

  // 3 Horizontal Radial Arms with Aerodynamic Hemispherical Cups (120 deg apart)
  const armLength = 0.16;
  const cupRadius = 0.052;
  for (let i = 0; i < 3; i++) {
    const armAngle = (i * 2 * Math.PI) / 3;

    // Horizontal radial arm rod
    const armRodGeo = new THREE.CylinderGeometry(0.006, 0.006, armLength, 12);
    const armRodMesh = new THREE.Mesh(armRodGeo, anodizedBlack);
    armRodMesh.rotation.z = Math.PI / 2;
    armRodMesh.position.set(
      (Math.cos(armAngle) * armLength) / 2,
      0,
      (Math.sin(armAngle) * armLength) / 2
    );
    armRodMesh.rotation.y = -armAngle;
    anemometerRotor.add(armRodMesh);

    // Hemispherical Hollow Cup
    // Use SphereGeometry with phiLength = Math.PI for hollow cup appearance
    const cupGeo = new THREE.SphereGeometry(
      cupRadius,
      24,
      16,
      0,
      Math.PI,
      0,
      Math.PI
    );
    const cupMesh = new THREE.Mesh(cupGeo, anodizedBlack);
    cupMesh.position.set(
      Math.cos(armAngle) * armLength,
      0,
      Math.sin(armAngle) * armLength
    );
    // Face cup perpendicular to arm radius to simulate wind catchment
    cupMesh.rotation.y = -armAngle + Math.PI / 2;
    cupMesh.rotation.x = Math.PI / 2;
    cupMesh.castShadow = true;
    anemometerRotor.add(cupMesh);
  }

  anemometerGroup.add(anemometerRotor);
  upperArmGroup.add(anemometerGroup);

  sensorAnchorPoints['wind_speed'] = new THREE.Vector3(-0.54, 2.38, 0.05);

  // --- B. RIGHT: WIND DIRECTION SENSOR (WIND VANE) ---
  const windVaneGroup = new THREE.Group();
  windVaneGroup.name = 'WindVane_Group';
  windVaneGroup.position.set(0.54, 0, 0);

  // Stationary Mounting Post
  const vanePostGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.26, 16);
  const vanePostMesh = new THREE.Mesh(vanePostGeo, anodizedBlack);
  vanePostMesh.position.y = 0.13;
  vanePostMesh.castShadow = true;
  windVaneGroup.add(vanePostMesh);

  // ROTATING VANE ASSEMBLY (Points into wind)
  const windVaneRotor = new THREE.Group();
  windVaneRotor.name = 'WindVane_Rotor';
  windVaneRotor.position.set(0, 0.26, 0);

  // Central hub
  const vaneHubGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.035, 24);
  const vaneHubMesh = new THREE.Mesh(vaneHubGeo, anodizedBlack);
  windVaneRotor.add(vaneHubMesh);

  // Horizontal Pointer Rod (0.34m length)
  const pointerRodGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.34, 12);
  const pointerRodMesh = new THREE.Mesh(pointerRodGeo, anodizedBlack);
  pointerRodMesh.rotation.z = Math.PI / 2;
  windVaneRotor.add(pointerRodMesh);

  // Front Counterweight Nose Cone
  const noseGeo = new THREE.ConeGeometry(0.024, 0.075, 16);
  const noseMesh = new THREE.Mesh(noseGeo, basePlateMaterial);
  noseMesh.rotation.z = -Math.PI / 2;
  noseMesh.position.set(0.18, 0, 0);
  windVaneRotor.add(noseMesh);

  // Rear Vertical Aerodynamic Tail Fin (Matching reference)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, -0.06);
  finShape.lineTo(0.14, -0.08);
  finShape.lineTo(0.12, 0.09);
  finShape.lineTo(0, 0.06);
  finShape.closePath();

  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.006, bevelEnabled: false });
  const finMesh = new THREE.Mesh(finGeo, anodizedBlack);
  finMesh.position.set(-0.31, 0, -0.003);
  finMesh.castShadow = true;
  windVaneRotor.add(finMesh);

  windVaneGroup.add(windVaneRotor);
  upperArmGroup.add(windVaneGroup);

  sensorAnchorPoints['wind_direction'] = new THREE.Vector3(0.54, 2.38, 0.05);

  root.add(upperArmGroup);

  explodedObjects.push({
    object: anemometerGroup,
    initialPos: anemometerGroup.position.clone(),
    explodedOffset: new THREE.Vector3(-0.45, 0.45, 0)
  });

  explodedObjects.push({
    object: windVaneGroup,
    initialPos: windVaneGroup.position.clone(),
    explodedOffset: new THREE.Vector3(0.45, 0.45, 0)
  });

  // =========================================================================
  // 7. COMMUNICATION ANTENNA (GSM / 4G / RADIO WHIP)
  // =========================================================================
  const antennaGroup = new THREE.Group();
  antennaGroup.name = 'Antenna_Group';
  antennaGroup.position.set(0, 2.35, 0);

  // Mounting collar
  const antMountGeo = new THREE.CylinderGeometry(0.028, 0.045, 0.07, 16);
  const antMountMesh = new THREE.Mesh(antMountGeo, anodizedBlack);
  antennaGroup.add(antMountMesh);

  // Whip Antenna Rod (Tapered 0.72m long)
  const whipGeo = new THREE.CylinderGeometry(0.003, 0.009, 0.72, 12);
  const whipMesh = new THREE.Mesh(whipGeo, anodizedBlack);
  whipMesh.position.y = 0.39;
  antennaGroup.add(whipMesh);

  // Top ball tip
  const tipGeo = new THREE.SphereGeometry(0.008, 12, 12);
  const tipMesh = new THREE.Mesh(tipGeo, anodizedBlack);
  tipMesh.position.y = 0.75;
  antennaGroup.add(tipMesh);

  root.add(antennaGroup);

  explodedObjects.push({
    object: antennaGroup,
    initialPos: antennaGroup.position.clone(),
    explodedOffset: new THREE.Vector3(0, 0.65, 0)
  });

  // =========================================================================
  // 8. REALISTIC PHYSICAL WIRING & CONDUITS (CURVED 3D TUBES)
  // =========================================================================
  const wiringGroup = new THREE.Group();
  wiringGroup.name = 'Wiring_Group';

  const cableDefinitions = [
    // Temp shield cable -> crossbar -> mast -> enclosure
    [
      new THREE.Vector3(-0.66, 0.95, 0.02),
      new THREE.Vector3(-0.66, 1.10, 0.02),
      new THREE.Vector3(-0.35, 1.12, 0.03),
      new THREE.Vector3(-0.06, 1.08, 0.03),
      new THREE.Vector3(-0.06, 0.60, 0.04),
      new THREE.Vector3(-0.14, 0.08, 0.04)
    ],
    // Pressure shield cable -> crossbar -> mast -> enclosure
    [
      new THREE.Vector3(0.66, 1.02, 0.02),
      new THREE.Vector3(0.35, 1.12, 0.03),
      new THREE.Vector3(0.06, 1.08, 0.03),
      new THREE.Vector3(0.06, 0.60, 0.04),
      new THREE.Vector3(-0.07, 0.08, 0.04)
    ],
    // Anemometer cable -> upper arm -> mast -> enclosure
    [
      new THREE.Vector3(-0.54, 2.05, 0.02),
      new THREE.Vector3(-0.25, 2.03, 0.03),
      new THREE.Vector3(-0.06, 1.95, 0.03),
      new THREE.Vector3(-0.06, 1.25, 0.04),
      new THREE.Vector3(-0.02, 0.60, 0.04),
      new THREE.Vector3(0.0, 0.08, 0.04)
    ],
    // Solar power conduit -> mast -> enclosure
    [
      new THREE.Vector3(-0.45, 0.02, 0.15),
      new THREE.Vector3(-0.30, -0.05, 0.12),
      new THREE.Vector3(-0.15, -0.12, 0.10),
      new THREE.Vector3(0.07, 0.08, 0.04)
    ]
  ];

  for (const points of cableDefinitions) {
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.008, 8, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, conduitCableMaterial);
    tubeMesh.castShadow = true;
    wiringGroup.add(tubeMesh);
  }

  root.add(wiringGroup);

  return {
    group: root,
    anemometerRotor,
    windVaneRotor,
    tempShieldMesh,
    tempGlowLight,
    tempGlowMesh,
    pressShieldMesh,
    solarPanelMesh,
    enclosureMesh,
    sensorAnchorPoints,
    explodedObjects,
    materials: {
      tempShield: tempShieldMaterial,
      pressShield: pressShieldMaterial,
      tempGlow: tempGlowMaterial,
      stainlessSteel,
      anodizedBlack,
      enclosure: enclosureMaterial,
      solarPanel: solarPanelMaterial
    }
  };
}
