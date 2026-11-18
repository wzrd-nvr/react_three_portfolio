import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const GLOBE_RADIUS = 1.5;
const SCENE_HALF_WIDTH = 2.5;
const CAMERA_DISTANCE = 8;

const AUTO_SPIN_SPEED = 0.12;
const IDLE_BEFORE_RESUME_MS = 6000;
const DRAG_RADIANS_PER_PIXEL = 0.006;
const INERTIA_DAMPING = 2.5;
const MAX_TILT = 1.0;
const INITIAL_TILT = 0.3;

const MOUNTAIN_RUGGEDNESS_START = 0.8;
const MOUNTAIN_RUGGEDNESS_FULL = 3.5;
const MOUNTAIN_TINT = 0.8;
const MOUNTAIN_REGION_BLUR_PX = 4;
const HILLSHADE_STRENGTH = 0.025;
const HILLSHADE_LIMIT = 0.2;
const HILLSHADE_LIGHT = [-0.7, 0.7];

const POLE_HEIGHT = 0.6;
const FLAG_WIDTH = 0.62;
const FLAG_HEIGHT = 0.36;
const FLAG_POP_DELAY = 0.4;
const FLAG_POP_STAGGER = 0.12;
const FLAG_HOVER_SCALE = 1.25;

const COLORS = {
  ocean: '#5aa9e6',
  land: '#8bd17c',
  highland: '#c2b77a',
  snow: '#f4f7fb',
  outline: '#0b1026',
  halo: '#9fd3ff',
  pole: '#fff8e1',
  knob: '#d4af37',
  labelText: '#fff8e1',
  cloud: '#ffffff',
};

const ROUTES = [
  { label: 'About', path: '/about', lat: 33.749, lon: -84.388, color: '#d4af37' },
  { label: 'Projects', path: '/projects', lat: -1.2921, lon: 36.8219, color: '#d4af37' },
  { label: 'Goals', path: '/goals', lat: -33.8688, lon: 151.2093, color: '#00e676' },
  { label: 'Resume', path: '/resume', lat: 51.5074, lon: -0.1278, color: '#00e676' },
  { label: 'Contact', path: '/contact', lat: 35.6762, lon: 139.6503, color: '#ff6b6b' },
  { label: 'GitHub', url: 'https://github.com/Lactoseandtolerance', lat: -22.9068, lon: -43.1729, color: '#2464eb' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/angel-nivar-a00740275/', lat: 1.3521, lon: 103.8198, color: '#0077b5' },
];

const CLOUD_COUNT = 16;
const CLOUD_SEED = 7;
const CLOUD_ALTITUDE = 0.1;
const CLOUD_MAX_LATITUDE = 70;
const CLOUD_FLAG_CLEARANCE_DEGREES = 14;
const CLOUD_SPACING_DEGREES = 18;
const CLOUD_PUSH_RADIUS = 0.5;
const CLOUD_PUSH_STRENGTH = 9;
const CLOUD_RETURN_SPRING = 2.5;
const CLOUD_DAMPING = 3.5;

const INTRO_START_FRACTION = 0.55;
const INTRO_DURATION_MS = 1100;
const FLIGHT_DURATION_MS = 1000;
const FLIGHT_APPROACH = 0.8;
const BOUNCE_IN_MS = 550;
const BOUNCE_OUT_MS = 750;

const UP = new THREE.Vector3(0, 1, 0);

// Matches the UV layout of THREE.SphereGeometry, so points line up with the equirectangular map.
const latLonToVector3 = (lat, lon, radius) => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const surfaceOrientation = (position) =>
  new THREE.Quaternion().setFromUnitVectors(UP, position.clone().normalize());

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const degreesBetween = (a, b) => THREE.MathUtils.radToDeg(a.angleTo(b));

// Seeded so the cloud layout is the same on every visit, while still looking scattered.
const generateClouds = () => {
  const random = mulberry32(CLOUD_SEED);
  const flagDirections = ROUTES.map((route) => latLonToVector3(route.lat, route.lon, 1));
  const clouds = [];

  for (let attempt = 0; clouds.length < CLOUD_COUNT && attempt < 1000; attempt++) {
    const lat = THREE.MathUtils.radToDeg(Math.asin(random() * 2 - 1));
    const lon = random() * 360 - 180;
    if (Math.abs(lat) > CLOUD_MAX_LATITUDE) continue;

    const direction = latLonToVector3(lat, lon, 1);
    if (flagDirections.some((flag) => degreesBetween(flag, direction) < CLOUD_FLAG_CLEARANCE_DEGREES)) continue;
    if (clouds.some((cloud) => degreesBetween(cloud.direction, direction) < CLOUD_SPACING_DEGREES)) continue;

    const puffCount = 4 + Math.floor(random() * 4);
    const puffs = Array.from({ length: puffCount }, (_, i) => {
      const along = (i / (puffCount - 1) - 0.5) * 0.28;
      const radius = 0.06 + (1 - Math.abs(along) / 0.14) * 0.05 + random() * 0.02;
      return [along + (random() - 0.5) * 0.03, radius * 0.6, (random() - 0.5) * 0.08, radius];
    });
    puffs.push([(random() - 0.5) * 0.06, 0.13, 0, 0.065 + random() * 0.02]);

    const yaw = new THREE.Quaternion().setFromAxisAngle(UP, random() * Math.PI * 2);
    const position = direction.clone().multiplyScalar(GLOBE_RADIUS + CLOUD_ALTITUDE);
    clouds.push({ direction, position, yaw, scale: 0.7 + random() * 0.6, puffs });
  }
  return clouds;
};

const CLOUDS = generateClouds();

const hexToRgb = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const smoothstep = (edge0, edge1, x) => {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const readPixels = (image, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  return { canvas, context, image: context.getImageData(0, 0, width, height) };
};

// Slope is sparse along ridgelines; blurring it turns ridges into whole mountain regions.
const buildRuggednessField = (normals, width, height) => {
  const slopeCanvas = document.createElement('canvas');
  slopeCanvas.width = width;
  slopeCanvas.height = height;
  const slopeContext = slopeCanvas.getContext('2d');
  const slopeImage = slopeContext.createImageData(width, height);
  for (let i = 0; i < normals.length; i += 4) {
    const slope = Math.min(255, Math.hypot(normals[i] - 128, normals[i + 1] - 128) * 20);
    slopeImage.data[i] = slopeImage.data[i + 1] = slopeImage.data[i + 2] = slope;
    slopeImage.data[i + 3] = 255;
  }
  slopeContext.putImageData(slopeImage, 0, 0);

  const blurred = document.createElement('canvas');
  blurred.width = width;
  blurred.height = height;
  const blurredContext = blurred.getContext('2d', { willReadFrequently: true });
  blurredContext.filter = `blur(${MOUNTAIN_REGION_BLUR_PX}px)`;
  blurredContext.drawImage(slopeCanvas, 0, 0);
  const data = blurredContext.getImageData(0, 0, width, height).data;
  return (index) => data[index] / 20;
};

// The specular map is white over water and black over land; repaint it as flat cartoon colors.
// The normal map adds two things to land: a highland tint over mountain regions, and a baked
// hillshade lit from the north-west, so relief shows regardless of where the real light falls.
const buildCartoonEarthTexture = (specularImage, normalImage) => {
  const width = 1024;
  const height = 512;
  const { canvas, context, image } = readPixels(specularImage, width, height);
  const normals = readPixels(normalImage, width, height).image.data;
  const ruggednessAt = buildRuggednessField(normals, width, height);

  const ocean = hexToRgb(COLORS.ocean);
  const land = hexToRgb(COLORS.land);
  const highland = hexToRgb(COLORS.highland);
  const snow = hexToRgb(COLORS.snow);

  for (let y = 0; y < height; y++) {
    const absoluteLatitude = Math.abs(90 - (y / height) * 180);
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const isWater = image.data[index] > 127;
      let color;
      if (isWater) color = absoluteLatitude > 80 ? snow : ocean;
      else if (absoluteLatitude > 62) color = snow;
      else {
        const ruggedness =
          smoothstep(MOUNTAIN_RUGGEDNESS_START, MOUNTAIN_RUGGEDNESS_FULL, ruggednessAt(index)) * MOUNTAIN_TINT;
        const facing =
          (normals[index] - 128) * HILLSHADE_LIGHT[0] + (normals[index + 1] - 128) * HILLSHADE_LIGHT[1];
        const shade = 1 + THREE.MathUtils.clamp(facing * HILLSHADE_STRENGTH, -HILLSHADE_LIMIT, HILLSHADE_LIMIT);
        color = land.map((channel, c) => (channel + (highland[c] - channel) * ruggedness) * shade);
      }
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const buildFlagTexture = (label, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 300;
  const context = canvas.getContext('2d');

  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 16;
  context.strokeStyle = COLORS.outline;
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  let fontSize = 120;
  do {
    context.font = `700 ${fontSize}px "Roboto Mono", monospace`;
    fontSize -= 4;
  } while (context.measureText(label).width > canvas.width - 80);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 14;
  context.strokeText(label, canvas.width / 2, canvas.height / 2 + 6);
  context.fillStyle = COLORS.labelText;
  context.fillText(label, canvas.width / 2, canvas.height / 2 + 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

const useToonGradient = () =>
  useMemo(() => {
    const texture = new THREE.DataTexture(new Uint8Array([140, 205, 255]), 3, 1, THREE.RedFormat);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    return texture;
  }, []);

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const FONT_WAIT_MS = 2500;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!query) return undefined;
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
};

// Flags wait briefly for the label font, then fall back to the system monospace so a slow or
// stalled font request never hides navigation. Labels repaint once the real font arrives.
const useLabelFont = (font) => {
  const [state, setState] = useState({ ready: false, loaded: false });
  useEffect(() => {
    let cancelled = false;
    const fallback = setTimeout(() => !cancelled && setState((s) => ({ ...s, ready: true })), FONT_WAIT_MS);
    document.fonts
      .load(font)
      .then(() => !cancelled && setState({ ready: true, loaded: true }))
      .catch(() => !cancelled && setState((s) => ({ ...s, ready: true })))
      .finally(() => clearTimeout(fallback));
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [font]);
  return state;
};

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// Owns the camera: rests at a distance that fits the screen, zooms out on arrival, and flies
// toward a flag on demand. `controllerRef.current.flyTo` is the entry point for flags.
const CameraRig = ({ controllerRef, busyRef, reducedMotion }) => {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const restPosition = useMemo(() => new THREE.Vector3(), []);
  const tween = useRef(null);

  // Narrow screens pull the camera back so the globe and its flags still fit horizontally.
  const restDistance = useMemo(() => {
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const aspect = size.width / size.height;
    return Math.max(CAMERA_DISTANCE, SCENE_HALF_WIDTH / (Math.tan(halfFov) * aspect));
  }, [camera, size]);
  restPosition.set(0, 0, restDistance);

  const startTween = (toPosition, toLook, duration, ease, onComplete) => {
    tween.current = {
      fromPosition: camera.position.clone(),
      fromLook: look.clone(),
      toPosition,
      toLook,
      duration,
      ease,
      onComplete,
      startedAt: null,
    };
  };

  useEffect(() => {
    if (reducedMotion) return;
    camera.position.set(0, 0, restDistance * INTRO_START_FRACTION);
    startTween(restPosition.clone(), new THREE.Vector3(), INTRO_DURATION_MS, easeOutCubic);
    // Only the first mount gets the intro zoom; resizes should not replay it.
  }, []);

  controllerRef.current = {
    flyTo(target, { onArrive, returnAfter = false }) {
      if (busyRef.current) return;
      if (reducedMotion) {
        onArrive?.();
        return;
      }
      busyRef.current = true;
      const toPosition = camera.position.clone().lerp(target, FLIGHT_APPROACH);
      if (returnAfter) {
        startTween(toPosition, target.clone(), BOUNCE_IN_MS, easeInOutCubic, () =>
          startTween(restPosition.clone(), new THREE.Vector3(), BOUNCE_OUT_MS, easeInOutCubic, () => {
            busyRef.current = false;
            onArrive?.();
          })
        );
      } else {
        startTween(toPosition, target.clone(), FLIGHT_DURATION_MS, easeInOutCubic, onArrive);
      }
    },
  };

  useFrame((state) => {
    const active = tween.current;
    if (!active) {
      camera.position.copy(restPosition);
      look.set(0, 0, 0);
      camera.lookAt(look);
      return;
    }
    active.startedAt ??= state.clock.elapsedTime;
    const progress = Math.min((state.clock.elapsedTime - active.startedAt) * 1000 / active.duration, 1);
    const eased = active.ease(progress);
    camera.position.lerpVectors(active.fromPosition, active.toPosition, eased);
    look.lerpVectors(active.fromLook, active.toLook, eased);
    camera.lookAt(look);
    if (progress === 1) {
      tween.current = null;
      active.onComplete?.();
    }
  });

  return null;
};

const Flag = ({ route, index, gradient, reducedMotion, fontLoaded, onSelect }) => {
  const { camera, gl } = useThree();
  const rootRef = useRef();
  const pivotRef = useRef();
  const clothRef = useRef();
  const hoveredRef = useRef(false);
  const spring = useRef({ scale: 0, velocity: 0 });
  const cameraInFlagSpace = useMemo(() => new THREE.Vector3(), []);

  const position = useMemo(() => latLonToVector3(route.lat, route.lon, GLOBE_RADIUS), [route]);
  const orientation = useMemo(() => surfaceOrientation(position), [position]);
  // fontLoaded is a dependency only so the label repaints once the real font is available.
  const texture = useMemo(() => buildFlagTexture(route.label, route.color), [route, fontLoaded]);
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(FLAG_WIDTH, FLAG_HEIGHT, 12, 6);
    plane.translate(FLAG_WIDTH / 2, 0, 0);
    return plane;
  }, []);
  const restX = useMemo(() => {
    const positions = geometry.attributes.position;
    return Float32Array.from({ length: positions.count }, (_, i) => positions.getX(i));
  }, [geometry]);

  useEffect(
    () => () => {
      texture.dispose();
      geometry.dispose();
    },
    [texture, geometry]
  );

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const step = Math.min(delta, 1 / 30);

    const appeared = time > FLAG_POP_DELAY + index * FLAG_POP_STAGGER;
    const target = appeared ? (hoveredRef.current ? FLAG_HOVER_SCALE : 1) : 0;
    const s = spring.current;
    if (reducedMotion) {
      s.scale = target;
    } else {
      s.velocity += (target - s.scale) * 140 * step;
      s.velocity *= Math.exp(-11 * step);
      s.scale += s.velocity * step;
    }
    rootRef.current.scale.setScalar(Math.max(s.scale, 0.0001));

    rootRef.current.worldToLocal(cameraInFlagSpace.copy(camera.position));
    pivotRef.current.rotation.y = Math.atan2(cameraInFlagSpace.x, cameraInFlagSpace.z);

    if (!reducedMotion) {
      const positions = clothRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = restX[i];
        positions.setZ(i, Math.sin(x * 9 - time * 4 + index) * 0.04 * (x / FLAG_WIDTH));
      }
      positions.needsUpdate = true;
      clothRef.current.geometry.computeVertexNormals();
    }
  });

  const setHovered = (hovered) => {
    hoveredRef.current = hovered;
    gl.domElement.style.cursor = hovered ? 'pointer' : 'grab';
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (event.delta > 6) return;
    onSelect(route, clothRef.current.getWorldPosition(new THREE.Vector3()));
  };

  return (
    <group
      ref={rootRef}
      position={position}
      quaternion={orientation}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
    >
      <mesh position={[0, POLE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, POLE_HEIGHT, 8]} />
        <meshToonMaterial color={COLORS.pole} gradientMap={gradient} />
      </mesh>
      <mesh position={[0, POLE_HEIGHT + 0.03, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshToonMaterial color={COLORS.knob} gradientMap={gradient} />
      </mesh>
      <group ref={pivotRef}>
        <mesh
          ref={clothRef}
          geometry={geometry}
          position={[0.02, POLE_HEIGHT - FLAG_HEIGHT / 2 - 0.01, 0]}
        >
          <meshToonMaterial map={texture} gradientMap={gradient} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// Each cloud is a damped spring anchored to its home spot on the cloud shell. The pointer's hit
// on that shell pushes nearby clouds away along the surface.
const CloudLayer = ({ globeRef, pointerInsideRef, gradient }) => {
  const groupRefs = useRef([]);
  const bodies = useMemo(
    () => CLOUDS.map((cloud) => ({ position: cloud.position.clone(), velocity: new THREE.Vector3() })),
    []
  );
  const scratch = useMemo(
    () => ({
      raycaster: new THREE.Raycaster(),
      shell: new THREE.Sphere(new THREE.Vector3(), GLOBE_RADIUS + CLOUD_ALTITUDE),
      hit: new THREE.Vector3(),
      force: new THREE.Vector3(),
      away: new THREE.Vector3(),
      normal: new THREE.Vector3(),
    }),
    []
  );

  useFrame(({ camera, pointer }, delta) => {
    const step = Math.min(delta, 1 / 30);
    const { raycaster, shell, hit, force, away, normal } = scratch;

    let pointerOnShell = false;
    if (pointerInsideRef.current) {
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectSphere(shell, hit)) {
        globeRef.current.worldToLocal(hit);
        pointerOnShell = true;
      }
    }

    CLOUDS.forEach((cloud, i) => {
      const body = bodies[i];
      force.subVectors(cloud.position, body.position).multiplyScalar(CLOUD_RETURN_SPRING);
      if (pointerOnShell) {
        away.subVectors(body.position, hit);
        const distance = away.length();
        if (distance < CLOUD_PUSH_RADIUS && distance > 1e-4) {
          force.addScaledVector(away.normalize(), CLOUD_PUSH_STRENGTH * (1 - distance / CLOUD_PUSH_RADIUS));
        }
      }

      body.velocity.addScaledVector(force, step).multiplyScalar(Math.exp(-CLOUD_DAMPING * step));
      body.position.addScaledVector(body.velocity, step).setLength(GLOBE_RADIUS + CLOUD_ALTITUDE);
      normal.copy(body.position).normalize();
      body.velocity.addScaledVector(normal, -body.velocity.dot(normal));

      const group = groupRefs.current[i];
      group.position.copy(body.position);
      group.quaternion.setFromUnitVectors(UP, normal).multiply(cloud.yaw);
    });
  });

  return CLOUDS.map(({ scale, puffs }, i) => (
    <group key={i} ref={(group) => (groupRefs.current[i] = group)} scale={[scale, scale * 0.85, scale]}>
      {puffs.map(([x, y, z, radius], index) => (
        <mesh key={index} position={[x, y, z]}>
          <icosahedronGeometry args={[radius, 2]} />
          <meshToonMaterial color={COLORS.cloud} gradientMap={gradient} />
        </mesh>
      ))}
    </group>
  ));
};

const useGlobeDrag = (globeRef, busyRef, reducedMotion) => {
  const { gl } = useThree();
  const motion = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    lastMoveAt: 0,
    lastInteractionAt: -Infinity,
    tiltVelocity: 0,
    spinVelocity: 0,
    autoSpin: reducedMotion ? 0 : AUTO_SPIN_SPEED,
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const m = motion.current;
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    const rotateBy = (spin, tilt) => {
      const globe = globeRef.current;
      globe.rotation.y += spin;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + tilt, -MAX_TILT, MAX_TILT);
    };

    const onDown = (event) => {
      if (busyRef.current) return;
      m.dragging = true;
      m.lastX = event.clientX;
      m.lastY = event.clientY;
      m.lastMoveAt = performance.now();
      m.tiltVelocity = 0;
      m.spinVelocity = 0;
      m.autoSpin = 0;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };

    const onMove = (event) => {
      if (!m.dragging) return;
      const now = performance.now();
      const seconds = Math.max((now - m.lastMoveAt) / 1000, 1 / 240);
      const spin = (event.clientX - m.lastX) * DRAG_RADIANS_PER_PIXEL;
      const tilt = (event.clientY - m.lastY) * DRAG_RADIANS_PER_PIXEL;
      rotateBy(spin, tilt);
      m.spinVelocity = THREE.MathUtils.lerp(m.spinVelocity, spin / seconds, 0.5);
      m.tiltVelocity = THREE.MathUtils.lerp(m.tiltVelocity, tilt / seconds, 0.5);
      m.lastX = event.clientX;
      m.lastY = event.clientY;
      m.lastMoveAt = now;
      m.lastInteractionAt = now;
    };

    const onUp = (event) => {
      if (!m.dragging) return;
      m.dragging = false;
      const now = performance.now();
      // Holding still before letting go should drop the globe, not fling it.
      if (now - m.lastMoveAt > 80) {
        m.spinVelocity = 0;
        m.tiltVelocity = 0;
      }
      m.lastInteractionAt = now;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [gl, globeRef, busyRef]);

  useFrame((_, delta) => {
    const m = motion.current;
    const globe = globeRef.current;
    if (m.dragging || busyRef.current) return;

    const step = Math.min(delta, 1 / 30);
    globe.rotation.y += m.spinVelocity * step;
    globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + m.tiltVelocity * step, -MAX_TILT, MAX_TILT);
    const decay = Math.exp(-INERTIA_DAMPING * step);
    m.spinVelocity *= decay;
    m.tiltVelocity *= decay;

    const idle = performance.now() - m.lastInteractionAt > IDLE_BEFORE_RESUME_MS;
    const targetSpin = idle && !reducedMotion ? AUTO_SPIN_SPEED : 0;
    m.autoSpin = THREE.MathUtils.damp(m.autoSpin, targetSpin, 0.8, step);
    globe.rotation.y += m.autoSpin * step;
  });
};

const usePointerInside = () => {
  const { gl } = useThree();
  const inside = useRef(false);
  useEffect(() => {
    const canvas = gl.domElement;
    const enter = () => (inside.current = true);
    const leave = () => (inside.current = false);
    canvas.addEventListener('pointerenter', enter);
    canvas.addEventListener('pointerleave', leave);
    return () => {
      canvas.removeEventListener('pointerenter', enter);
      canvas.removeEventListener('pointerleave', leave);
    };
  }, [gl]);
  return inside;
};

const GlobeScene = ({ onNavigate, onDeparture }) => {
  const reducedMotion = usePrefersReducedMotion();
  const gradient = useToonGradient();
  const labelFont = useLabelFont('700 64px "Roboto Mono"');
  const globeRef = useRef();
  const cameraRef = useRef();
  const busyRef = useRef(false);
  const pointerInsideRef = usePointerInside();

  const [specularMap, normalMap] = useLoader(THREE.TextureLoader, [
    '/earth_specular_map.jpg',
    '/earth_normal_map.jpg',
  ]);
  const earthTexture = useMemo(
    () => buildCartoonEarthTexture(specularMap.image, normalMap.image),
    [specularMap, normalMap]
  );
  useEffect(() => () => earthTexture.dispose(), [earthTexture]);

  useGlobeDrag(globeRef, busyRef, reducedMotion);

  const handleSelect = (route, flagPosition) => {
    if (busyRef.current) return;
    if (route.url) {
      // Opened inside the click so popup blockers allow it; the zoom is only a flourish.
      window.open(route.url, '_blank', 'noopener,noreferrer');
      cameraRef.current.flyTo(flagPosition, { returnAfter: true });
      return;
    }
    onDeparture();
    cameraRef.current.flyTo(flagPosition, { onArrive: () => onNavigate(route.path) });
  };

  const blockPointer = (event) => event.stopPropagation();

  return (
    <>
      <CameraRig controllerRef={cameraRef} busyRef={busyRef} reducedMotion={reducedMotion} />
      <Stars radius={60} depth={30} count={1200} factor={3} saturation={0} fade speed={reducedMotion ? 0 : 0.6} />

      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 3, 5]} intensity={2.2} />

      <group ref={globeRef} rotation={[INITIAL_TILT, 0, 0]}>
        {/* Handlers only exist so the globe occludes flags on its far side from pointer hits. */}
        <mesh onPointerOver={blockPointer} onClick={blockPointer}>
          <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
          <meshToonMaterial map={earthTexture} gradientMap={gradient} />
        </mesh>
        <mesh scale={1.035}>
          <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
          <meshBasicMaterial color={COLORS.outline} side={THREE.BackSide} />
        </mesh>
        {labelFont.ready &&
          ROUTES.map((route, index) => (
            <Flag
              key={route.label}
              route={route}
              index={index}
              gradient={gradient}
              reducedMotion={reducedMotion}
              fontLoaded={labelFont.loaded}
              onSelect={handleSelect}
            />
          ))}
        <CloudLayer globeRef={globeRef} pointerInsideRef={pointerInsideRef} gradient={gradient} />
      </group>

      <mesh scale={1.12}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <meshBasicMaterial color={COLORS.halo} transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </>
  );
};

export default GlobeScene;
