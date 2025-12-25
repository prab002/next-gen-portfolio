"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Environment, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import styles from '../styles/PortfolioTerminal.module.css';

interface CyberLogisticsProps {
  onExit: () => void;
}

const CITY_SIZE = 40;
const BLOCK_SIZE = 20;
const BUILDING_COUNT = 120;
const TREE_COUNT = 80;
const DRONE_SPEED = 25;
const DRONE_TURN_SPEED = 2.5;
const DRONE_HEIGHT = 12;
const GAME_TIME = 90;
const PACKAGES_TO_WIN = 10;

interface Package {
  id: number;
  position: THREE.Vector3;
  collected: boolean;
}

interface DeliveryZone {
  id: number;
  position: THREE.Vector3;
  active: boolean;
}

const City = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { matrices, colors } = useMemo(() => {
    const tempDummy = new THREE.Object3D();
    const tempMatrices: THREE.Matrix4[] = [];
    const tempColors = new Float32Array(BUILDING_COUNT * 3);
    const colorPalette = [
      new THREE.Color('#e0e0e0'),
      new THREE.Color('#c0c0c0'),
      new THREE.Color('#a8a8a8'),
      new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < BUILDING_COUNT; i++) {
      const x = (Math.random() - 0.5) * CITY_SIZE * BLOCK_SIZE * 1.5;
      const z = (Math.random() - 0.5) * CITY_SIZE * BLOCK_SIZE * 1.5;
      const height = 15 + Math.random() * 50;

      tempDummy.position.set(x, height / 2, z);
      tempDummy.scale.set(8 + Math.random() * 6, height, 8 + Math.random() * 6);
      tempDummy.updateMatrix();
      tempMatrices.push(tempDummy.matrix.clone());

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      color.toArray(tempColors, i * 3);
    }

    return { matrices: tempMatrices, colors: tempColors };
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      matrices.forEach((matrix, i) => {
        meshRef.current!.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    }
  }, [matrices, colors]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BUILDING_COUNT]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={0.6} metalness={0.2} />
    </instancedMesh>
  );
};

const Trees = () => {
  const treePositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < TREE_COUNT; i++) {
      positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * CITY_SIZE * BLOCK_SIZE * 1.8,
          0,
          (Math.random() - 0.5) * CITY_SIZE * BLOCK_SIZE * 1.8
        )
      );
    }
    return positions;
  }, []);

  return (
    <>
      {treePositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.5, 0.7, 4, 8]} />
            <meshStandardMaterial color="#654321" roughness={0.9} />
          </mesh>
          <mesh position={[0, 5, 0]}>
            <coneGeometry args={[2.5, 5, 8]} />
            <meshStandardMaterial color="#2d5016" roughness={0.8} />
          </mesh>
          <mesh position={[0, 7.5, 0]}>
            <coneGeometry args={[2, 4, 8]} />
            <meshStandardMaterial color="#3a6b1f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 9.5, 0]}>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshStandardMaterial color="#4a8228" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
};

const PackagePickup = ({ pkg, canPickup }: { pkg: Package; canPickup: boolean }) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && !pkg.collected) {
      meshRef.current.rotation.y += 0.015;
      meshRef.current.position.y = pkg.position.y + Math.sin(state.clock.elapsedTime * 2) * 0.4;
    }
    if (ringRef.current && canPickup) {
      ringRef.current.rotation.y += 0.02;
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.2 + 0.8;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  if (pkg.collected) return null;

  return (
    <group ref={meshRef} position={pkg.position}>
      <mesh>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.91, 0]}>
        <boxGeometry args={[1.9, 0.1, 0.3]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.91, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.9, 0.1, 0.3]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.5} />
      </mesh>
      <pointLight color="#FFA500" intensity={40} distance={12} />

      {/* Green pickup range indicator */}
      {canPickup && (
        <>
          <mesh ref={ringRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3, 4, 32]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive="#00ff00"
              emissiveIntensity={2}
              transparent
              opacity={0.6}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[3, 32]} />
            <meshStandardMaterial
              color="#00ff00"
              transparent
              opacity={0.2}
            />
          </mesh>
          <pointLight color="#00ff00" intensity={100} distance={15} />
        </>
      )}

      <Html center distanceFactor={15}>
        <div style={{
          background: canPickup ? 'rgba(0, 255, 0, 0.95)' : 'rgba(255, 165, 0, 0.9)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          border: canPickup ? '2px solid #00ff00' : '2px solid #FF8C00',
          pointerEvents: 'none'
        }}>
          {canPickup ? '✅ PRESS P TO PICKUP' : '📦 PICKUP'}
        </div>
      </Html>
    </group>
  );
};

const DeliveryZoneComponent = ({ zone }: { zone: DeliveryZone }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.opacity = zone.active ? pulse : 0.4;
      }
    }
  });

  return (
    <group position={zone.position}>
      <mesh ref={meshRef} position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 5, 32]} />
        <meshStandardMaterial
          color={zone.active ? "#4CAF50" : "#757575"}
          emissive={zone.active ? "#2E7D32" : "#424242"}
          emissiveIntensity={zone.active ? 0.5 : 0.2}
          transparent
          opacity={zone.active ? 0.7 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial
          color={zone.active ? "#81C784" : "#9E9E9E"}
          transparent
          opacity={0.3}
        />
      </mesh>
      {zone.active && (
        <pointLight color="#4CAF50" intensity={100} distance={20} />
      )}
      <Html center distanceFactor={20}>
        <div style={{
          background: zone.active ? 'rgba(76, 175, 80, 0.95)' : 'rgba(117, 117, 117, 0.8)',
          padding: '6px 14px',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          fontWeight: 'bold',
          color: 'white',
          whiteSpace: 'nowrap',
          boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
          border: zone.active ? '2px solid #66BB6A' : '2px solid #757575',
          pointerEvents: 'none'
        }}>
          {zone.active ? '🎯 DROP ZONE - PRESS SPACE' : '📍 Delivery Zone'}
        </div>
      </Html>
    </group>
  );
};

const RealisticDrone = ({ hasPackage }: { hasPackage: boolean }) => {
  const propellerRefs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];

  useFrame(() => {
    propellerRefs.forEach(ref => {
      if (ref.current) {
        ref.current.rotation.y += 0.5;
      }
    });
  });

  return (
    <group>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[1.5, 0.6, 1.5]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Camera gimbal */}
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#34495e" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Arms */}
      {[
        [-1.5, 0, -1.5],
        [1.5, 0, -1.5],
        [-1.5, 0, 1.5],
        [1.5, 0, 1.5],
      ].map((pos, i) => (
        <group key={i}>
          <mesh position={[pos[0] / 2, 0, pos[2] / 2]} rotation={[0, Math.atan2(pos[2], pos[0]), 0]}>
            <cylinderGeometry args={[0.1, 0.1, 2.1, 8]} />
            <meshStandardMaterial color="#e74c3c" roughness={0.5} metalness={0.5} />
          </mesh>

          {/* Motor */}
          <mesh position={[pos[0], 0.1, pos[2]]}>
            <cylinderGeometry args={[0.25, 0.25, 0.4, 16]} />
            <meshStandardMaterial color="#34495e" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Propeller */}
          <mesh ref={propellerRefs[i]} position={[pos[0], 0.4, pos[2]]}>
            <boxGeometry args={[2, 0.05, 0.3]} />
            <meshStandardMaterial color="#7f8c8d" roughness={0.2} metalness={0.8} transparent opacity={0.7} />
          </mesh>

          {/* LED lights */}
          <mesh position={[pos[0], -0.1, pos[2]]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color={i < 2 ? "#e74c3c" : "#27ae60"}
              emissive={i < 2 ? "#e74c3c" : "#27ae60"}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[pos[0], -0.1, pos[2]]}
            color={i < 2 ? "#e74c3c" : "#27ae60"}
            intensity={15}
            distance={6}
          />
        </group>
      ))}

      {/* Battery indicator */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.5]} />
        <meshStandardMaterial color="#3498db" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Package attached */}
      {hasPackage && (
        <group position={[0, -1.2, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 1.2, 1.2]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.61, 0]}>
            <boxGeometry args={[1.3, 0.08, 0.2]} />
            <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.61, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[1.3, 0.08, 0.2]} />
            <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Attachment cables */}
          {[[-0.4, 0], [0.4, 0], [0, -0.4], [0, 0.4]].map((offset, i) => (
            <mesh key={i} position={[offset[0], 0.6, offset[1]]}>
              <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

const Drone = ({
  packages,
  deliveryZones,
  onCollect,
  onDeliver,
  hasPackage,
  canDrop,
  setCanPickup,
  setNearestPackageId,
  setDronePosition,
}: {
  packages: Package[];
  deliveryZones: DeliveryZone[];
  onCollect: (id: number) => void;
  onDeliver: () => void;
  hasPackage: boolean;
  canDrop: boolean;
  setCanPickup: (can: boolean) => void;
  setNearestPackageId: (id: number | null) => void;
  setDronePosition: (pos: THREE.Vector3) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef<{ [key: string]: boolean }>({});
  const nearestPackageRef = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'Space' && hasPackage && canDrop) {
        onDeliver();
      }
      if (e.code === 'KeyP' && !hasPackage && nearestPackageRef.current !== null) {
        onCollect(nearestPackageRef.current);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [hasPackage, canDrop, onDeliver, onCollect]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const drone = groupRef.current;
    const time = state.clock.getElapsedTime();

    drone.position.y = DRONE_HEIGHT + Math.sin(time * 2) * 0.25;

    if (keys.current['KeyA'] || keys.current['ArrowLeft']) drone.rotation.y += DRONE_TURN_SPEED * delta;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) drone.rotation.y -= DRONE_TURN_SPEED * delta;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), drone.rotation.y);

    if (keys.current['KeyW'] || keys.current['ArrowUp']) {
      velocity.current.add(forward.multiplyScalar(DRONE_SPEED * delta));
    }
    if (keys.current['KeyS'] || keys.current['ArrowDown']) {
      velocity.current.add(forward.multiplyScalar(-DRONE_SPEED * 0.5 * delta));
    }

    velocity.current.multiplyScalar(0.93);
    drone.position.add(new THREE.Vector3(velocity.current.x * delta * 10, 0, velocity.current.z * delta * 10));

    const cameraOffset = new THREE.Vector3(0, 15, 25).applyAxisAngle(new THREE.Vector3(0, 1, 0), drone.rotation.y);
    const cameraPos = drone.position.clone().add(cameraOffset);
    state.camera.position.lerp(cameraPos, 0.08);
    state.camera.lookAt(new THREE.Vector3(drone.position.x, drone.position.y, drone.position.z));

    // Update drone position for parent component
    setDronePosition(drone.position.clone());

    // Check for nearby packages
    if (!hasPackage) {
      let nearestPackage: Package | null = null;
      let nearestDistance = Infinity;

      packages.forEach((pkg) => {
        if (!pkg.collected) {
          const distance = drone.position.distanceTo(pkg.position);
          if (distance < 15 && distance < nearestDistance) {
            nearestDistance = distance;
            nearestPackage = pkg;
          }
        }
      });

      if (nearestPackage) {
        const pkg = nearestPackage as Package;
        nearestPackageRef.current = pkg.id;
        setCanPickup(true);
        setNearestPackageId(pkg.id);
      } else {
        nearestPackageRef.current = null;
        setCanPickup(false);
        setNearestPackageId(null);
      }
    } else {
      nearestPackageRef.current = null;
      setCanPickup(false);
      setNearestPackageId(null);
    }
  });

  return (
    <group ref={groupRef}>
      <RealisticDrone hasPackage={hasPackage} />
    </group>
  );
};

const GameScene = ({
  packages,
  deliveryZones,
  onCollect,
  onDeliver,
  hasPackage,
  dronePosition,
  setCanPickup,
  setNearestPackageId,
  setDronePosition,
  nearestPackageId,
}: {
  packages: Package[];
  deliveryZones: DeliveryZone[];
  onCollect: (id: number) => void;
  onDeliver: () => void;
  hasPackage: boolean;
  dronePosition: THREE.Vector3 | null;
  setCanPickup: (can: boolean) => void;
  setNearestPackageId: (id: number | null) => void;
  setDronePosition: (pos: THREE.Vector3) => void;
  nearestPackageId: number | null;
}) => {
  const activeZone = deliveryZones.find(z => z.active);
  const canDrop = activeZone && dronePosition ? dronePosition.distanceTo(activeZone.position) < 15 : false;

  return (
    <>
      <PerspectiveCamera makeDefault fov={70} position={[0, 20, 30]} />
      <fog attach="fog" args={['#87CEEB', 50, 300]} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <hemisphereLight args={['#87CEEB', '#6B8E23', 0.4]} />
      <Environment preset="city" />

      <City />
      <Trees />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#7CB342" roughness={0.9} />
      </mesh>

      {/* Roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <planeGeometry args={[10, 2000]} />
        <meshStandardMaterial color="#424242" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <planeGeometry args={[2000, 10]} />
        <meshStandardMaterial color="#424242" roughness={0.8} />
      </mesh>

      {packages.map((pkg) => (
        <PackagePickup key={pkg.id} pkg={pkg} canPickup={pkg.id === nearestPackageId} />
      ))}

      {deliveryZones.map((zone) => (
        <DeliveryZoneComponent key={zone.id} zone={zone} />
      ))}

      <Drone
        packages={packages}
        deliveryZones={deliveryZones}
        onCollect={onCollect}
        onDeliver={onDeliver}
        hasPackage={hasPackage}
        canDrop={canDrop}
        setCanPickup={setCanPickup}
        setNearestPackageId={setNearestPackageId}
        setDronePosition={setDronePosition}
      />
    </>
  );
};

export const CyberLogistics: React.FC<CyberLogisticsProps> = ({ onExit }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [hasPackage, setHasPackage] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [dronePosition, setDronePosition] = useState<THREE.Vector3 | null>(null);
  const [canPickup, setCanPickup] = useState(false);
  const [nearestPackageId, setNearestPackageId] = useState<number | null>(null);

  useEffect(() => {
    if (!gameStarted) return;

    const initialPackages: Package[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 180,
        3,
        (Math.random() - 0.5) * 180
      ),
      collected: false,
    }));

    const initialZones: DeliveryZone[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 150,
        0,
        (Math.random() - 0.5) * 150
      ),
      active: false,
    }));

    setPackages(initialPackages);
    setDeliveryZones(initialZones);
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || won) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, won]);

  useEffect(() => {
    if (score >= PACKAGES_TO_WIN) {
      setWon(true);
    }
  }, [score]);

  const handleCollect = (id: number) => {
    if (hasPackage) return;

    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, collected: true } : pkg))
    );
    setHasPackage(true);
    setDeliveryZones((prev) =>
      prev.map((zone, i) => (i === 0 ? { ...zone, active: true } : zone))
    );
  };

  const handleDeliver = () => {
    if (!hasPackage) return;

    const activeZone = deliveryZones.find(z => z.active);
    if (!activeZone || !dronePosition) return;

    if (dronePosition.distanceTo(activeZone.position) < 15) {
      setScore((prev) => prev + 1);
      setHasPackage(false);
      setDeliveryZones((prev) => prev.map((zone) => ({ ...zone, active: false })));

      const newPackage: Package = {
        id: Date.now(),
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 180,
          3,
          (Math.random() - 0.5) * 180
        ),
        collected: false,
      };
      setPackages((prev) => [...prev, newPackage]);
    }
  };

  const handleRestart = () => {
    setGameStarted(false);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameOver(false);
    setWon(false);
    setHasPackage(false);
    setPackages([]);
    setDeliveryZones([]);
    setDronePosition(null);
    setTimeout(() => setGameStarted(true), 100);
  };

  if (!gameStarted) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '650px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🚁</div>
          <h1
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
              fontWeight: '800',
            }}
          >
            Drone Delivery
          </h1>
          <p
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              color: '#666',
              fontSize: '1.2rem',
              marginBottom: '2rem',
              fontWeight: '500',
            }}
          >
            Professional Logistics Simulation
          </p>
          <div
            style={{
              background: '#f8f9fa',
              border: '2px solid #e9ecef',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              borderRadius: '12px',
              textAlign: 'left',
            }}
          >
            <h3 style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#667eea', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>
              Mission Objectives
            </h3>
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', margin: '0.7rem 0', fontSize: '1.05rem' }}>
              ✈️ Fly close to brown packages
            </p>
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', margin: '0.7rem 0', fontSize: '1.05rem' }}>
              📦 Press <strong>P</strong> to pickup packages
            </p>
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', margin: '0.7rem 0', fontSize: '1.05rem' }}>
              🎯 Navigate to green delivery zones
            </p>
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', margin: '0.7rem 0', fontSize: '1.05rem' }}>
              📦 Press <strong>SPACE</strong> to drop package in the zone
            </p>
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', margin: '0.7rem 0', fontSize: '1.05rem' }}>
              🏆 Complete {PACKAGES_TO_WIN} deliveries within {GAME_TIME} seconds
            </p>
          </div>
          <div
            style={{
              background: '#f8f9fa',
              border: '2px solid #e9ecef',
              padding: '1.5rem',
              marginBottom: '2rem',
              borderRadius: '12px',
              textAlign: 'left',
            }}
          >
            <h3 style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#764ba2', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '700' }}>
              Controls
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', fontSize: '1.05rem' }}>
                <strong>W / ↑</strong> - Forward
              </p>
              <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', fontSize: '1.05rem' }}>
                <strong>S / ↓</strong> - Backward
              </p>
              <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', fontSize: '1.05rem' }}>
                <strong>A / ←</strong> - Turn Left
              </p>
              <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#333', fontSize: '1.05rem' }}>
                <strong>D / →</strong> - Turn Right
              </p>
            </div>
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#ff9800', marginTop: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
              <strong>P</strong> - Pickup Package
            </p>
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#e74c3c', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: '600' }}>
              <strong>SPACE</strong> - Drop Package
            </p>
          </div>
          <button
            onClick={() => setGameStarted(true)}
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '1.5rem',
              padding: '1rem 3rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s',
              marginBottom: '1rem',
              fontWeight: '700',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
            }}
          >
            🚀 Start Mission
          </button>
          <br />
          <button
            onClick={onExit}
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '1rem',
              padding: '0.6rem 1.8rem',
              background: 'transparent',
              color: '#666',
              border: '2px solid #ddd',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#333';
              e.currentTarget.style.borderColor = '#999';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  if (gameOver || won) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          background: won
            ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
            : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>{won ? '🏆' : '⏱️'}</div>
          <h1
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '2.8rem',
              color: won ? '#11998e' : '#eb3349',
              marginBottom: '1rem',
              fontWeight: '800',
            }}
          >
            {won ? 'Mission Complete!' : 'Time\'s Up!'}
          </h1>
          <p
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              color: '#333',
              fontSize: '1.8rem',
              marginBottom: '1rem',
              fontWeight: '700',
            }}
          >
            Deliveries: {score} / {PACKAGES_TO_WIN}
          </p>
          {won && (
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#666', fontSize: '1.2rem', marginBottom: '2rem' }}>
              Excellent work! All packages delivered successfully! 🎉
            </p>
          )}
          {!won && (
            <p style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#666', fontSize: '1.2rem', marginBottom: '2rem' }}>
              Keep practicing to improve your delivery time!
            </p>
          )}
          <button
            onClick={handleRestart}
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '1.3rem',
              padding: '0.9rem 2.5rem',
              background: won ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              transition: 'all 0.3s',
              marginRight: '1rem',
              fontWeight: '700',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
            }}
          >
            🔄 Play Again
          </button>
          <button
            onClick={onExit}
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '1.3rem',
              padding: '0.9rem 2.5rem',
              background: 'transparent',
              color: '#666',
              border: '2px solid #ddd',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#333';
              e.currentTarget.style.borderColor = '#999';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  const activeZone = deliveryZones.find(z => z.active);
  const canDrop = activeZone && dronePosition ? dronePosition.distanceTo(activeZone.position) < 15 : false;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
        background: '#87CEEB',
      }}
    >
      {/* Modern HUD */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        {/* Top Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '1rem 1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div>
              <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                DELIVERIES
              </div>
              <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: '1.8rem', color: '#667eea', fontWeight: '800' }}>
                {score} / {PACKAGES_TO_WIN}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                TIME LEFT
              </div>
              <div style={{
                fontFamily: '"Segoe UI", Arial, sans-serif',
                fontSize: '1.8rem',
                color: timeLeft < 20 ? '#e74c3c' : '#4CAF50',
                fontWeight: '800'
              }}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          <button
            onClick={onExit}
            style={{
              pointerEvents: 'auto',
              fontFamily: '"Segoe UI", Arial, sans-serif',
              background: '#f8f9fa',
              border: '2px solid #dee2e6',
              padding: '0.6rem 1.5rem',
              color: '#495057',
              cursor: 'pointer',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e9ecef';
              e.currentTarget.style.borderColor = '#adb5bd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.borderColor = '#dee2e6';
            }}
          >
            ✕ Exit
          </button>
        </div>

        {/* Status Card */}
        <div style={{
          background: hasPackage ? 'rgba(76, 175, 80, 0.95)' : 'rgba(158, 158, 158, 0.95)',
          borderRadius: '15px',
          padding: '1rem 1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          maxWidth: '350px',
          transition: 'all 0.3s',
        }}>
          <div style={{
            fontFamily: '"Segoe UI", Arial, sans-serif',
            fontSize: '1.2rem',
            color: 'white',
            fontWeight: '700',
            marginBottom: '0.3rem'
          }}>
            {hasPackage ? '📦 Package Loaded' : '⬜ No Package'}
          </div>
          <div style={{
            fontFamily: '"Segoe UI", Arial, sans-serif',
            fontSize: '0.95rem',
            color: 'rgba(255,255,255,0.9)',
            fontWeight: '500'
          }}>
            {hasPackage
              ? 'Navigate to the green delivery zone'
              : 'Fly to an orange package to collect it'}
          </div>
        </div>
      </div>

      {/* Pickup Button */}
      {!hasPackage && canPickup && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}>
          <button
            onClick={() => nearestPackageId && handleCollect(nearestPackageId)}
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '1.5rem',
              padding: '1.2rem 3rem',
              background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(255, 152, 0, 0.5)',
              transition: 'all 0.3s',
              fontWeight: '800',
              pointerEvents: 'auto',
              animation: 'pulse 1.5s infinite',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 152, 0, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 152, 0, 0.5)';
            }}
          >
            📦 PICKUP PACKAGE (P)
          </button>
        </div>
      )}

      {/* Drop Button */}
      {hasPackage && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}>
          <button
            onClick={handleDeliver}
            disabled={!canDrop}
            style={{
              fontFamily: '"Segoe UI", Arial, sans-serif',
              fontSize: '1.5rem',
              padding: '1.2rem 3rem',
              background: canDrop
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              cursor: canDrop ? 'pointer' : 'not-allowed',
              boxShadow: canDrop ? '0 8px 30px rgba(17, 153, 142, 0.5)' : '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.3s',
              fontWeight: '800',
              pointerEvents: 'auto',
              opacity: canDrop ? 1 : 0.6,
              animation: canDrop ? 'pulse 1.5s infinite' : 'none',
            }}
            onMouseEnter={(e) => {
              if (canDrop) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(17, 153, 142, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = canDrop ? '0 8px 30px rgba(17, 153, 142, 0.5)' : '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            {canDrop ? '📦 DROP PACKAGE (SPACE)' : '🚫 Move to Drop Zone'}
          </button>
        </div>
      )}

      {/* Controls Help */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          maxWidth: '200px',
        }}
      >
        <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: '0.75rem', color: '#666', fontWeight: '600', marginBottom: '0.5rem' }}>
          CONTROLS
        </div>
        <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', fontSize: '0.85rem', color: '#333', lineHeight: '1.6' }}>
          <div><strong>WASD</strong> / Arrows - Fly</div>
          <div><strong>P</strong> - Pickup Package</div>
          <div><strong>SPACE</strong> - Drop Package</div>
        </div>
      </div>

      <Canvas shadows>
        <GameScene
          packages={packages}
          deliveryZones={deliveryZones}
          onCollect={handleCollect}
          onDeliver={handleDeliver}
          hasPackage={hasPackage}
          dronePosition={dronePosition}
          setCanPickup={setCanPickup}
          setNearestPackageId={setNearestPackageId}
          setDronePosition={setDronePosition}
          nearestPackageId={nearestPackageId}
        />
      </Canvas>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
        `}
      </style>
    </div>
  );
};
