"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useEffect, useState, MutableRefObject } from "react";
import * as THREE from "three";
import TypingAnimation from "./TypingAnimation";

interface MainSceneProps {
  scrollRef: MutableRefObject<number>;
  onSphereClick: (categoryIndex: number, color: THREE.Color) => void;
}

interface Keyframe {
  time: number;
  camera: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

const KEYFRAMES: Keyframe[] = [
  { time: 0, camera: { x: 1.89478963, y: 2.12609083, z: 0.03816118 }, target: { x: -0.17105497, y: 1.94335313, z: 0.06506983 } },
  { time: 4, camera: { x: 1.89478963, y: 2.12609083, z: 0.03816118 }, target: { x: -0.17105497, y: 1.94335313, z: 0.06506983 } },
  { time: 10, camera: { x: 1.3273693, y: 1.1954697, z: -1.43071121 }, target: { x: -0.05086938, y: 0.04843492, z: 0.00674811 } },
  { time: 11, camera: { x: 0.47584514, y: 2.28678501, z: -0.05995339 }, target: { x: -0.05867177, y: 0.05165433, z: -0.05835893 } },
  { time: 12, camera: { x: 0.47584514, y: 2.28678501, z: -0.05995339 }, target: { x: -0.05867177, y: 0.05165433, z: -0.05835893 } },
  { time: 22, camera: { x: 1.38117674, y: -1.11978312, z: 0.04935918 }, target: { x: 0.07502792, y: -1.15072725, z: 0.00732804 } }
];

interface OriginalSphereProps {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
}

function findSegment(t: number) {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
    if (t >= a.time && t <= b.time) {
      const u = (t - a.time) / (b.time - a.time);
      const eased = u * u * (3 - 2 * u);
      return { a, b, u: eased };
    }
  }
  const last = KEYFRAMES[KEYFRAMES.length - 1];
  return { a: last, b: last, u: 0 };
}

function MainSceneContent({ scrollRef, onSphereClick }: MainSceneProps) {
  const { scene, animations } = useGLTF("/model.glb");
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<THREE.AnimationAction[]>([]);
  const { camera } = useThree();
  const currentCamPos = useRef(new THREE.Vector3());
  const currentTarget = useRef(new THREE.Vector3());
  const [sphereMaterials, setSpheres] = useState<THREE.MeshStandardMaterial[]>([]);
  const [panelMaterial, setPanel] = useState<THREE.MeshStandardMaterial | null>(null);
  const [textMaterial, setText] = useState<THREE.MeshStandardMaterial | null>(null);
  const sphereOriginalColors = useRef<OriginalSphereProps[]>([]);
  const sphereObjects = useRef<THREE.Mesh[]>([]);
  const [intensity, setIntensity] = useState(1.5);

  useEffect(() => {
    if (animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      const actions: THREE.AnimationAction[] = [];
      animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip);
        action.play();
        actions.push(action);
      });
      actionsRef.current = actions;
    }

    const sphereMats: THREE.MeshStandardMaterial[] = [];
    const originalColors: OriginalSphereProps[] = [];
    const spheres: THREE.Mesh[] = [];

    for (let i = 0; i <= 22; i++) {
      const possibleNames = [
        i === 0 ? "Sphere" : `Sphere${String(i).padStart(3, '0')}`,
        i === 0 ? "Sphere" : `Sphere.${String(i).padStart(3, '0')}`,
        `Sphere${i}`,
        `Sphere_${i}`,
        `sphere${i}`,
        `Sphere.${i}`
      ];

      let sphere: THREE.Mesh | undefined;

      for (const name of possibleNames) {
        sphere = scene.getObjectByName(name) as THREE.Mesh | undefined;
        if (sphere) break;
      }

      if (sphere) {
        if (sphere.material) {
          const mat = sphere.material as THREE.MeshStandardMaterial;
          sphereMats.push(mat);
          originalColors.push({
            color: mat.color.clone(),
            emissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000),
            emissiveIntensity: mat.emissiveIntensity || 0,
            metalness: mat.metalness || 0,
            roughness: mat.roughness || 0.5
          });
        }

        sphere.userData.categoryIndex = i;
        sphere.userData.isSphere = true;
        spheres.push(sphere);
      }
    }

    setSpheres(sphereMats);
    sphereOriginalColors.current = originalColors;
    sphereObjects.current = spheres;

    const panel = scene.getObjectByName("Panel") as THREE.Mesh | undefined;
    if (panel && panel.material) setPanel(panel.material as THREE.MeshStandardMaterial);

    const text = scene.getObjectByName("text.031") as THREE.Mesh | undefined;
    if (text && text.material) setText(text.material as THREE.MeshStandardMaterial);

    currentCamPos.current.copy(camera.position);
    const lookTarget = new THREE.Vector3();
    camera.getWorldDirection(lookTarget);
    currentTarget.current.copy(lookTarget);
  }, [scene, animations, camera]);

  useFrame(() => {
    const t = scrollRef.current;

    if (t >= 3.5 && t <= 4.5) setIntensity(4);
    else if (t >= 11 && t <= 15) setIntensity(5);
    else setIntensity(1.5);

    if (mixerRef.current && actionsRef.current.length > 0) {
      actionsRef.current.forEach(action => {
        const duration = action.getClip().duration;
        const normalizedTime = (t / 22) * duration;
        action.time = normalizedTime;
        action.paused = false;
      });
      mixerRef.current.update(0);
      actionsRef.current.forEach(action => action.paused = true);
    }

    const { a, b, u } = findSegment(t);
    const targetCamPos = new THREE.Vector3(
      THREE.MathUtils.lerp(a.camera.x, b.camera.x, u),
      THREE.MathUtils.lerp(a.camera.y, b.camera.y, u),
      THREE.MathUtils.lerp(a.camera.z, b.camera.z, u)
    );
    const targetLookAt = new THREE.Vector3(
      THREE.MathUtils.lerp(a.target.x, b.target.x, u),
      THREE.MathUtils.lerp(a.target.y, b.target.y, u),
      THREE.MathUtils.lerp(a.target.z, b.target.z, u)
    );

    currentCamPos.current.lerp(targetCamPos, 0.1);
    currentTarget.current.lerp(targetLookAt, 0.1);
    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentTarget.current);

    if (sphereMaterials.length > 0 && sphereOriginalColors.current.length > 0) {
      sphereMaterials.forEach((mat, idx) => {
        const original = sphereOriginalColors.current[idx];
        if (original && mat.color) {
          mat.color.copy(original.color);
          mat.emissive.copy(original.emissive);
          mat.emissiveIntensity = original.emissiveIntensity;
          mat.metalness = original.metalness;
          mat.roughness = original.roughness;
        }
      });
    }

    if (t >= 10 && panelMaterial && !panelMaterial.userData.colorChanged) {
      panelMaterial.color.set("#BB88FF");
      panelMaterial.emissive = new THREE.Color("#BB88FF");
      panelMaterial.emissiveIntensity = 0.3;
      panelMaterial.userData.colorChanged = true;
    }
    if (t < 10 && panelMaterial && panelMaterial.userData.colorChanged) {
      panelMaterial.userData.colorChanged = false;
    }

    if (textMaterial) {
      if (t >= 0 && t < 4) {
        textMaterial.color.set("#000000");
        textMaterial.emissive = new THREE.Color("#000000");
        textMaterial.emissiveIntensity = 0;
      } else if (t >= 12) {
        textMaterial.color.set("#FFFFFF");
        textMaterial.emissive = new THREE.Color("#FFFFFF");
        textMaterial.emissiveIntensity = 0.8;
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();

    const t = scrollRef.current;
    if (t < 11) return;

    let clickedObject = e.object;
    let foundSphere = null;

    if (clickedObject.name && (
      clickedObject.name === 'Sphere' ||
      clickedObject.name.match(/^Sphere\d{3}$/) ||
      clickedObject.name.match(/^Sphere\.\d{3}$/)
    )) {
      foundSphere = clickedObject;

      if (clickedObject.name === 'Sphere') {
        clickedObject.userData.categoryIndex = 0;
      } else {
        const match = clickedObject.name.match(/\d+/);
        if (match) {
          clickedObject.userData.categoryIndex = parseInt(match[0]);
        }
      }
      clickedObject.userData.isSphere = true;
    }

    if (!foundSphere) {
      while (clickedObject) {
        if (clickedObject.userData?.isSphere) {
          foundSphere = clickedObject;
          break;
        }
        clickedObject = clickedObject.parent;
      }
    }

    if (foundSphere) {
      const categoryIndex = foundSphere.userData.categoryIndex as number;
      const sphereColor = sphereOriginalColors.current[categoryIndex]?.color;

      if (sphereColor) {
        onSphereClick(categoryIndex, sphereColor);
      }
    }
  };

  return (
    <>
      <ambientLight intensity={intensity} />
      <directionalLight position={[5, 5, 5]} intensity={intensity} />
      <directionalLight position={[-5, 3, -5]} intensity={intensity * 0.7} />
      <pointLight position={[0, 5, 0]} intensity={intensity * 0.8} />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={intensity} />
      <hemisphereLight groundColor="#ffffff" intensity={intensity * 0.4} />

      <primitive object={scene} onPointerDown={handlePointerDown} />
    </>
  );
}

export default function MainScene({ scrollRef, onSphereClick }: MainSceneProps) {
  const [scrollTime, setScrollTime] = useState(0);
  const [showScrollText, setShowScrollText] = useState(true);
  const [showAllInOne, setShowAllInOne] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollTime(scrollRef.current);
    }, 16);
    return () => clearInterval(interval);
  }, [scrollRef]);

  useEffect(() => {
    if (scrollTime >= 21) {
      setShowAllInOne(true);
    } else {
      setShowAllInOne(false);
    }
  }, [scrollTime]);

  const navbarOpacity = scrollTime >= 21 ? 1 : 0;

  return (
    <>
      {showScrollText && scrollTime < 4 && (
        <div style={{ position: 'fixed', top: '40px', left: '40px', zIndex: 50 }}>
          <TypingAnimation category="just scroll" />
        </div>
      )}

      {showAllInOne && (
        <div style={{ 
          position: 'fixed', 
          bottom: '35vh', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 50,
          whiteSpace: 'nowrap'
        }}>
          <TypingAnimation category="all in one." />
        </div>
      )}

      {scrollTime >= 21 && (
        <div style={{
          position: 'fixed', top: '40px', right: '40px', zIndex: 50,
          display: 'flex', gap: '20px', alignItems: 'center',
          opacity: navbarOpacity, transition: 'opacity 0.3s ease'
        }}>
          <a href="https://monad.xyz" target="_blank" style={{ transition: 'transform 0.2s' }}
             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <img src="/logo.png" alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
          </a>
          <a href="https://x.com/monad" target="_blank" rel="noopener noreferrer"
             style={{ transition: 'transform 0.2s' }}
             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <img src="/x.png" alt="X" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
          </a>
          <a href="https://discord.gg/monad" target="_blank" rel="noopener noreferrer"
             style={{ transition: 'transform 0.2s' }}
             onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
             onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <img src="/dc.png" alt="Discord" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
          </a>
        </div>
      )}

      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />

      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh" }}>
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
          <color attach="background" args={["#000"]} />
          <MainSceneContent scrollRef={scrollRef} onSphereClick={onSphereClick} />
        </Canvas>
      </div>
    </>
  );
}