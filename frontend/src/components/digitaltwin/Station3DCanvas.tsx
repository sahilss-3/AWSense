import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  RotateCw,
  Layers,
  Maximize2,
  Minimize2,
  MousePointer2,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { createAWSStationModel, AWSModelRefs } from './AWSStationModel';
import { SensorPinsOverlay, SensorPinInfo } from './SensorPinsOverlay';

interface Station3DCanvasProps {
  selectedSensorId: string;
  onSelectSensor: (id: string) => void;
  hoveredSensorId: string | null;
  onHoverSensor: (id: string | null) => void;
  pinsData: Record<string, SensorPinInfo>;
  isAnomalyActive: boolean;
  windSpeedVal?: number;
}

export const Station3DCanvas: React.FC<Station3DCanvasProps> = ({
  selectedSensorId,
  onSelectSensor,
  hoveredSensorId,
  onHoverSensor,
  pinsData,
  isAnomalyActive,
  windSpeedVal = 2.4
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Screen-space 2D positions for callout badge pins
  const [screenPositions, setScreenPositions] = useState<
    Record<string, { x: number; y: number; visible: boolean }>
  >({});

  // 3D Controls state
  const [showSensorLabels, setShowSensorLabels] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // References to Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRefsRef = useRef<AWSModelRefs | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animFrameIdRef = useRef<number | null>(null);

  // Camera glide targets
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(2.8, 1.6, 3.4));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.1, 0));
  const isTransitioningRef = useRef<boolean>(false);

  // Camera preset focus positions
  const getSensorFocusTargets = useCallback((sensorId: string) => {
    switch (sensorId) {
      case 'temperature':
        return {
          cam: new THREE.Vector3(-1.3, 1.35, 1.3),
          look: new THREE.Vector3(-0.66, 1.25, 0.05)
        };
      case 'humidity':
        return {
          cam: new THREE.Vector3(-1.3, 1.15, 1.3),
          look: new THREE.Vector3(-0.66, 1.05, 0.05)
        };
      case 'pressure':
        return {
          cam: new THREE.Vector3(1.3, 1.35, 1.3),
          look: new THREE.Vector3(0.66, 1.2, 0.05)
        };
      case 'wind_speed':
        return {
          cam: new THREE.Vector3(-1.15, 2.55, 1.2),
          look: new THREE.Vector3(-0.54, 2.38, 0.05)
        };
      case 'wind_direction':
        return {
          cam: new THREE.Vector3(1.15, 2.55, 1.2),
          look: new THREE.Vector3(0.54, 2.38, 0.05)
        };
      case 'solar_panel':
        return {
          cam: new THREE.Vector3(-1.3, 0.45, 1.5),
          look: new THREE.Vector3(-0.55, 0.18, 0.22)
        };
      case 'data_logger':
        return {
          cam: new THREE.Vector3(0.4, 0.5, 1.45),
          look: new THREE.Vector3(0.06, 0.4, 0.15)
        };
      default:
        // Overview perspective
        return {
          cam: new THREE.Vector3(2.8, 1.6, 3.4),
          look: new THREE.Vector3(0, 1.1, 0)
        };
    }
  }, []);

  // Smoothly move camera when selected sensor changes
  useEffect(() => {
    const targets = getSensorFocusTargets(selectedSensorId);
    targetCamPosRef.current.copy(targets.cam);
    targetLookAtRef.current.copy(targets.look);
    isTransitioningRef.current = true;
  }, [selectedSensorId, getSensorFocusTargets]);

  const handleResetView = () => {
    targetCamPosRef.current.set(2.8, 1.6, 3.4);
    targetLookAtRef.current.set(0, 1.1, 0);
    isTransitioningRef.current = true;
    setIsExploded(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Initialize Three.js Scene, Camera, Renderer, Lighting & Controls
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Load pristine mountain background texture directly into Three.js scene
    const bgLoader = new THREE.TextureLoader();
    bgLoader.load(
      '/digital_twin_bg.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
      },
      undefined,
      (err) => {
        console.warn('Three.js texture load fallback to container CSS background', err);
      }
    );

    // 2. Camera (Matching front-left perspective from reference)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2.8, 1.6, 3.4);
    cameraRef.current = camera;

    // 3. Renderer with transparent background for natural mountain hero backdrop
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.1, 0);
    controls.minDistance = 1.1;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go under ground
    controls.minPolarAngle = 0.15;
    controlsRef.current = controls;

    // 5. Natural Daylight Lighting (Morning mountain sun & skylight)
    const sunLight = new THREE.DirectionalLight('#FFF7ED', 2.3);
    sunLight.position.set(5.5, 8.0, 4.5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -2.5;
    sunLight.shadow.camera.right = 2.5;
    sunLight.shadow.camera.top = 4.0;
    sunLight.shadow.camera.bottom = -2.0;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Natural outdoor atmospheric bounce light
    const hemiLight = new THREE.HemisphereLight('#BAE6FD', '#78716C', 1.15);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Soft sky rim light from left
    const fillLight = new THREE.DirectionalLight('#93C5FD', 0.6);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    // Subtle ambient light
    const ambientLight = new THREE.AmbientLight('#FFFFFF', 0.35);
    scene.add(ambientLight);

    // 6. Contact shadow ground receiver plane
    const shadowGeo = new THREE.PlaneGeometry(5.0, 5.0);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.52;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // 7. Load & Attach Procedural 3D AWS Model
    const modelRefs = createAWSStationModel();
    modelRefsRef.current = modelRefs;
    scene.add(modelRefs.group);

    // Hit-testing group for direct 3D physical sensor interaction (click & hover)
    const hitSpheresGroup = new THREE.Group();
    hitSpheresGroup.name = 'hitSpheres';
    const hitSphereMap: Record<string, THREE.Mesh> = {};

    for (const [sensorId, anchorPos] of Object.entries(modelRefs.sensorAnchorPoints)) {
      const hitGeom = new THREE.SphereGeometry(0.35, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({
        visible: false,
        transparent: true,
        opacity: 0
      });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.copy(anchorPos);
      hitMesh.userData = { sensorId };
      hitSpheresGroup.add(hitMesh);
      hitSphereMap[sensorId] = hitMesh;
    }
    scene.add(hitSpheresGroup);

    // 8. 60 FPS Render & Physics Animation Loop
    const clock = clockRef.current;
    clock.start();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // ===================================================================
      // WIND SPEED SENSOR ANEMOMETER CONTINUOUS ROTATION (CRUCIAL)
      // Continuously rotates the 3-cup assembly without stopping during camera movements
      // ===================================================================
      if (modelRefs.anemometerRotor) {
        // Speed proportional to live wind speed (~2.5 to 4.5 rad/s)
        const rotationSpeed = Math.max(1.8, (windSpeedVal || 2.4) * 0.95);
        modelRefs.anemometerRotor.rotation.y += rotationSpeed * delta;
      }

      // Wind Vane subtle realistic natural aerodynamic micro-sway
      if (modelRefs.windVaneRotor) {
        const baseVaneAngle = -0.35; // Default orientation WNW
        modelRefs.windVaneRotor.rotation.y =
          baseVaneAngle + Math.sin(elapsedTime * 0.75) * 0.05 + Math.sin(elapsedTime * 1.9) * 0.02;
      }

      // ===================================================================
      // PHYSICAL ANOMALY PULSATING RED GLOW
      // Attached directly to the temperature radiation shield
      // ===================================================================
      if (isAnomalyActive) {
        const pulse = 0.5 + 0.5 * Math.sin(elapsedTime * 4.2);
        // PointLight pulsating intensity
        modelRefs.tempGlowLight.intensity = 1.0 + pulse * 2.2;
        // Volumetric glow mesh pulsating opacity
        modelRefs.materials.tempGlow.opacity = 0.2 + pulse * 0.45;
        // Shield plates emissive glow
        modelRefs.materials.tempShield.emissive.setRGB(0.85 * (0.4 + pulse * 0.6), 0.05, 0.05);
      } else {
        modelRefs.tempGlowLight.intensity = 0.0;
        modelRefs.materials.tempGlow.opacity = 0.0;
        modelRefs.materials.tempShield.emissive.setRGB(0, 0, 0);
      }

      // ===================================================================
      // EXPLODED VIEW INTERPOLATION
      // Smoothly displaces sensor modules outwards along their axes
      // ===================================================================
      for (const item of modelRefs.explodedObjects) {
        const target = isExploded
          ? item.initialPos.clone().add(item.explodedOffset)
          : item.initialPos;
        item.object.position.lerp(target, 0.08);
      }

      // Update hit spheres positions for exploded view
      for (const [sId, hitMesh] of Object.entries(hitSphereMap)) {
        const initialPos = modelRefs.sensorAnchorPoints[sId];
        if (initialPos) {
          hitMesh.position.copy(initialPos);
          if (isExploded) {
            if (sId === 'temperature' || sId === 'humidity') hitMesh.position.x -= 0.55;
            else if (sId === 'pressure') hitMesh.position.x += 0.55;
            else if (sId === 'wind_speed') { hitMesh.position.x -= 0.45; hitMesh.position.y += 0.45; }
            else if (sId === 'wind_direction') { hitMesh.position.x += 0.45; hitMesh.position.y += 0.45; }
            else if (sId === 'solar_panel') { hitMesh.position.x -= 0.6; hitMesh.position.z += 0.6; }
            else if (sId === 'data_logger') { hitMesh.position.x += 0.35; hitMesh.position.z += 0.55; }
          }
        }
      }

      // ===================================================================
      // SMOOTH CAMERA GLIDE TRANSITIONS
      // ===================================================================
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.055);
        controls.target.lerp(targetLookAtRef.current, 0.055);

        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.01 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.01
        ) {
          isTransitioningRef.current = false;
        }
      }

      // Auto-Rotate turntable mode
      if (autoRotate) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.6;
      } else {
        controls.autoRotate = false;
      }

      controls.update();
      renderer.render(scene, camera);

      // ===================================================================
      // PROJECT 3D SENSOR POSITIONS TO 2D SCREEN SPACE FOR CALLOUT BADGES
      // ===================================================================
      const newScreenPositions: Record<string, { x: number; y: number; visible: boolean }> = {};
      const tempVec = new THREE.Vector3();
      const rect = container.getBoundingClientRect();

      for (const [sId, worldPos] of Object.entries(modelRefs.sensorAnchorPoints)) {
        tempVec.copy(worldPos);

        // If exploded, adjust worldPos accordingly
        if (isExploded) {
          if (sId === 'temperature' || sId === 'humidity') tempVec.x -= 0.55;
          else if (sId === 'pressure') tempVec.x += 0.55;
          else if (sId === 'wind_speed') { tempVec.x -= 0.45; tempVec.y += 0.45; }
          else if (sId === 'wind_direction') { tempVec.x += 0.45; tempVec.y += 0.45; }
          else if (sId === 'solar_panel') { tempVec.x -= 0.6; tempVec.z += 0.6; }
          else if (sId === 'data_logger') { tempVec.x += 0.35; tempVec.z += 0.55; }
        }

        // Project to normalized device coordinates (-1 to +1)
        tempVec.project(camera);

        // Check if in front of camera
        const isBehind = tempVec.z > 1.0;
        const screenX = ((tempVec.x + 1) / 2) * rect.width;
        const screenY = ((-tempVec.y + 1) / 2) * rect.height;

        newScreenPositions[sId] = {
          x: Math.round(screenX),
          y: Math.round(screenY),
          visible: !isBehind && screenX >= -20 && screenX <= rect.width + 20 && screenY >= -20 && screenY <= rect.height + 20
        };
      }

      setScreenPositions(newScreenPositions);
    };

    animate();

    // Direct 3D Canvas Sensor Raycasting for click & hover interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!canvas || !camera) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hitSpheresGroup.children, false);
      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.sensorId;
        if (hitId) {
          canvas.style.cursor = 'pointer';
          onHoverSensor(hitId);
          return;
        }
      }
      canvas.style.cursor = 'grab';
      onHoverSensor(null);
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Camera orbit drag, not a single click

      if (!canvas || !camera) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hitSpheresGroup.children, false);
      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.sensorId;
        if (hitId) {
          onSelectSensor(hitId);
        }
      }
    };

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);

    // Window resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mouseup', handlePointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, [windSpeedVal, isAnomalyActive, autoRotate, isExploded]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl overflow-hidden shadow-card border border-[#D9DEE5] select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[540px] lg:h-[580px]'
      }`}
      style={{
        backgroundImage: 'url(/digital_twin_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%'
      }}
    >
      {/* Subtle atmospheric gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />

      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* 2D Callout Badge Pins Overlay */}
      <SensorPinsOverlay
        screenPositions={screenPositions}
        activeSensorId={selectedSensorId}
        onSelectSensor={onSelectSensor}
        hoveredSensorId={hoveredSensorId}
        onHoverSensor={onHoverSensor}
        pinsData={pinsData}
        showSensorLabels={showSensorLabels}
      />

      {/* =================================================================== */}
      {/* BOTTOM VIEWPORT CONTROLS BAR (Matches reference exactly)             */}
      {/* =================================================================== */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-3 z-20 pointer-events-none">
        {/* Left Navigation Guidance */}
        <div className="flex items-center gap-2 bg-[#0F172A]/85 backdrop-blur-md text-white/90 text-[11px] font-sans px-3.5 py-1.5 rounded-lg border border-white/15 shadow-md pointer-events-auto">
          <MousePointer2 size={13} className="text-[#93C5FD]" />
          <span>Drag to rotate</span>
          <span className="text-white/30">•</span>
          <span>Scroll to zoom</span>
          <span className="text-white/30">•</span>
          <span>Click sensor to inspect</span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Sensor Labels Visibility Toggle (Default: OFF) */}
          <button
            onClick={() => setShowSensorLabels((prev) => !prev)}
            className={`flex items-center gap-1.5 backdrop-blur-md text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all shadow-md active:scale-95 ${
              showSensorLabels
                ? 'bg-[#10B981] text-white border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-[#0F172A]/85 hover:bg-[#1E293B] text-white/90 border-white/15'
            }`}
            title="Toggle visibility of floating sensor data labels"
          >
            {showSensorLabels ? (
              <Eye size={12} className="text-white" />
            ) : (
              <EyeOff size={12} className="text-slate-400" />
            )}
            <span>Sensor Labels</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                showSensorLabels ? 'bg-white/25 text-white' : 'bg-white/10 text-slate-300'
              }`}
            >
              {showSensorLabels ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 bg-[#0F172A]/85 hover:bg-[#1E293B] backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition-all shadow-md active:scale-95"
            title="Reset camera to default overview"
          >
            <RotateCcw size={12} className="text-[#93C5FD]" />
            <span>Reset View</span>
          </button>

          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`flex items-center gap-1.5 backdrop-blur-md text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all shadow-md active:scale-95 ${
              autoRotate
                ? 'bg-[#1D4ED8] text-white border-blue-400 ring-2 ring-blue-400/30'
                : 'bg-[#0F172A]/85 hover:bg-[#1E293B] text-white border-white/15'
            }`}
            title="Toggle turntable auto rotation"
          >
            <RotateCw size={12} className={autoRotate ? 'animate-spin text-white' : 'text-[#93C5FD]'} />
            <span>Auto Rotate</span>
          </button>

          <button
            onClick={() => setIsExploded((prev) => !prev)}
            className={`flex items-center gap-1.5 backdrop-blur-md text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all shadow-md active:scale-95 ${
              isExploded
                ? 'bg-[#0284C7] text-white border-sky-400 ring-2 ring-sky-400/30'
                : 'bg-[#0F172A]/85 hover:bg-[#1E293B] text-white border-white/15'
            }`}
            title="Explode components to view internal assembly"
          >
            <Layers size={12} className="text-[#93C5FD]" />
            <span>Exploded View</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-[#0F172A]/85 hover:bg-[#1E293B] backdrop-blur-md text-white rounded-lg border border-white/15 transition-all shadow-md active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};
