"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Center, OrbitControls } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import TypingAnimation from "./TypingAnimation";
import { DappData } from "@/types";

interface CategorySceneProps {
  category: string;
  sphereColor: THREE.Color | null;
  dappsData: DappData[];
  onBack: () => void;
}

const PLANE_ORDER = [
  'Plane021_1','Plane022_1','Plane023_1','Plane001_1','Plane025_1',
  'Plane026_1','Plane027_1','Plane029_1','Plane030_1','Plane031_1',
  'Plane032_1','Plane042_1','Plane034_1','Plane035_1','Plane036_1',
  'Plane037_1','Plane038_1','Plane039_1','Plane033_1','Plane041_1',
  'Plane043_1'
];

function CategorySceneContent({ category, sphereColor, dappsData, onDappClick, onDappHover }: Omit<CategorySceneProps, 'onBack'> & { onDappClick: (dapp: DappData | undefined) => void; onDappHover: (dapp: DappData | undefined, e?: any) => void }) {
  const { scene, animations } = useGLTF("/show_2.glb");
  const { camera } = useThree();
  const [spriteIndex, setSpriteIndex] = useState(0);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const planes = useRef<THREE.Mesh[]>([]);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const sprites = useRef<THREE.Texture[]>([]);
  const controlsRef = useRef<any>(null);
  const animationProgress = useRef(0);
  const isAnimating = useRef(true);

  useFrame((_, delta) => {
    if (isAnimating.current) {
      animationProgress.current += delta / 2; 
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        isAnimating.current = false;
      }
      
      const t = animationProgress.current;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      const startCam = { x: -0.10593415, y: 1.02099343, z: 3.21718734 };
      const startTarget = { x: 0, y: 0, z: 0 };
      
      const endCam = { x: 2.53846791, y: 0.2378312, z: 0.09818723 };
      const endTarget = { x: -0.07117899, y: 0.11718515, z: 0.04206141 };
      
      camera.position.x = startCam.x + (endCam.x - startCam.x) * eased;
      camera.position.y = startCam.y + (endCam.y - startCam.y) * eased;
      camera.position.z = startCam.z + (endCam.z - startCam.z) * eased;
      
      if (controlsRef.current) {
        controlsRef.current.target.x = startTarget.x + (endTarget.x - startTarget.x) * eased;
        controlsRef.current.target.y = startTarget.y + (endTarget.y - startTarget.y) * eased;
        controlsRef.current.target.z = startTarget.z + (endTarget.z - startTarget.z) * eased;
        controlsRef.current.update();
      }
    }
  });

  useEffect(() => {
    if (category === "DeFi") {
      for (let i = 1; i <= 6; i++) {
        const tex = new THREE.TextureLoader().load(`/DeFi_${i}.png`);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        sprites.current.push(tex);
      }
    } else {
      const tex = new THREE.TextureLoader().load(`/${category}.png`);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      sprites.current.push(tex);
    }
  }, [category]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone());
      } else {
        mesh.material = mesh.material.clone();
      }
      
      if (mesh.name.includes("Cube")) cubeRef.current = mesh;
      
      const planeIndex = PLANE_ORDER.indexOf(mesh.name);
      if (planeIndex !== -1) {
        mesh.userData.isPlane = true;
        mesh.userData.planeIndex = planeIndex;
        planes.current.push(mesh);
      }
    });
    
    if (animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene);
      mixer.current.clipAction(animations[0]).play();
    }
  }, [scene, animations]);
  
  useFrame((_, delta) => mixer.current?.update(delta));
  
  useEffect(() => {
    if (cubeRef.current && sphereColor) {
      const mat = cubeRef.current.material;
      if (Array.isArray(mat)) {
        mat.forEach((m: THREE.Material) => {
          if ('color' in m) (m as THREE.MeshStandardMaterial).color?.copy(sphereColor);
        });
      } else if ('color' in mat) {
        (mat as THREE.MeshStandardMaterial).color?.copy(sphereColor);
      }
    }

    const currentSprite = sprites.current[spriteIndex];
    if (currentSprite) {
      const applySprite = (mesh: THREE.Mesh) => {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        if (mats.length >= 2) {
          (mats[1] as THREE.MeshStandardMaterial).map = currentSprite;
          mats[1].needsUpdate = true;
        } else {
          (mats[0] as THREE.MeshStandardMaterial).map = currentSprite;
          mats[0].needsUpdate = true;
        }
      };
      planes.current.forEach(applySprite);
    }
  }, [sphereColor, spriteIndex]);

  useEffect(() => {
    if (category === "DeFi") {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY > 0) {
          setSpriteIndex(prev => Math.min(5, prev + 1));
        } else {
          setSpriteIndex(prev => Math.max(0, prev - 1));
        }
      };
      window.addEventListener('wheel', handleWheel);
      return () => window.removeEventListener('wheel', handleWheel);
    }
  }, [category]);

  const getDappForPlane = (planeIndex: number): DappData | undefined => {
    if (category === "DeFi") {
      const dappIndex = spriteIndex * 21 + planeIndex;
      return dappsData[dappIndex];
    }
    return dappsData[planeIndex];
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    
    let clickedObject = e.object;
    let foundPlane = null;
    
    while (clickedObject) {
      if (clickedObject.userData?.isPlane) {
        foundPlane = clickedObject;
        break;
      }
      clickedObject = clickedObject.parent;
    }

    if (foundPlane) {
      const dapp = getDappForPlane(foundPlane.userData.planeIndex as number);
      onDappClick(dapp); 
    }
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    
    let hoveredObject = e.object;
    let foundPlane = null;
    
    while (hoveredObject) {
      if (hoveredObject.userData?.isPlane) {
        foundPlane = hoveredObject;
        break;
      }
      hoveredObject = hoveredObject.parent;
    }

    if (foundPlane) {
      const dapp = getDappForPlane(foundPlane.userData.planeIndex as number);
      if (dapp) {
        onDappHover(dapp, e);
        document.body.style.cursor = 'pointer';
      } else {
        onDappHover(undefined);
        document.body.style.cursor = 'default';
      }
    } else {
      onDappHover(undefined);
      document.body.style.cursor = 'default';
    }
  };

  const handlePointerLeave = () => {
    onDappHover(undefined);
    document.body.style.cursor = 'default';
  };

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={3} castShadow />
      <directionalLight position={[-4, 3, -3]} intensity={1.5} />
      <pointLight position={[0, 4, 0]} intensity={2} distance={10} />
      
      <Center position={[0, 0, 0]}>
        <primitive 
          object={scene} 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        />
      </Center>

      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={false}
        enableRotate={true}
        enabled={!isAnimating.current}
        makeDefault
      />
    </>
  );
}

export default function CategoryScene({ category, sphereColor, dappsData, onBack }: CategorySceneProps) {
  const [selectedDapp, setSelectedDapp] = useState<DappData | null>(null);
  const [showTrollface, setShowTrollface] = useState(false);
  const [hoveredDapp, setHoveredDapp] = useState<{ name: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/accelerada.mp3');
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleDappClick = (dapp: DappData | undefined) => {
    if (dapp) {
      setSelectedDapp(dapp);
    } else {
      setShowTrollface(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        
        audioRef.current.onended = () => {
          setShowTrollface(false);
        };
      }
    }
  };

  const handleDappHover = (dapp: DappData | undefined, e?: any) => {
    if (dapp) {
      setHoveredDapp({
        name: dapp.name,
        x: mousePos.x,
        y: mousePos.y
      });
    } else {
      setHoveredDapp(null);
    }
  };

  return (
    <>
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: '30px',
          left: '30px',
          zIndex: 100,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '64px',
          fontWeight: '900',
          color: 'white',
          textShadow: '4px 4px 8px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.3)',
          padding: 0,
          lineHeight: '1',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ←
      </button>
      {category && <TypingAnimation category={category} />}
      
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh" }}>
        <Canvas camera={{ position: [-0.10593415, 1.02099343, 3.21718734], fov: 50 }}>
          <color attach="background" args={["#000"]} />
          <CategorySceneContent 
            category={category}
            sphereColor={sphereColor}
            dappsData={dappsData}
            onDappClick={handleDappClick}
            onDappHover={handleDappHover}
          />
        </Canvas>
      </div>

      {showTrollface && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(128, 128, 128, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'all',
            cursor: 'not-allowed'
          }}
          onClick={(e) => e.preventDefault()}
        >
          <img 
            src="/trollface.png" 
            alt="Trollface"
            style={{
              maxWidth: '80%',
              maxHeight: '80%',
              objectFit: 'contain',
              imageRendering: 'crisp-edges'
            }}
          />
        </div>
      )}

      {selectedDapp && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedDapp(null)}
        >
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#ECE9D8',
              border: '3px solid #0054E3',
              borderRadius: '8px',
              width: '600px',
              maxWidth: '90vw',
              boxShadow: '0 0 30px rgba(0,0,0,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: 'linear-gradient(to right, #0054E3, #1084D0)',
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '5px 5px 0 0'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                {selectedDapp.name}
              </span>
              <button
                onClick={() => setSelectedDapp(null)}
                style={{
                  background: '#C94949',
                  border: '1px solid #8B0000',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              background: '#ECE9D8',
              padding: '30px',
              minHeight: '200px'
            }}>
              <p style={{ marginTop: 0, marginBottom: '25px', color: '#000', lineHeight: '1.6', fontSize: '16px' }}>
                {selectedDapp.info}
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <a 
                  href={selectedDapp.web}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 20px',
                    background: '#C0C0C0',
                    border: '2px outset #fff',
                    color: '#000',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Visit Website
                </a>
                {selectedDapp.x && (
                  <a 
                    href={selectedDapp.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 20px',
                      background: '#C0C0C0',
                      border: '2px outset #fff',
                      color: '#000',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    X / Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {hoveredDapp && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredDapp.x + 15}px`,
            top: `${hoveredDapp.y + 15}px`,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 9998,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}
        >
          {hoveredDapp.name}
        </div>
      )}
    </>
  );
}