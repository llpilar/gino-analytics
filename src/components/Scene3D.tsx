import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Environment, PerspectiveCamera } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

// Colombia Globe Component
const ColombiaGlobe = () => {
  const globeRef = useRef<THREE.Mesh>(null);

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={globeRef} args={[2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#1a8fff"
          attach="material"
          distort={0.1}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Colombia highlight ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[2.1, 0.02, 16, 100]} />
        <meshStandardMaterial 
          color="#ffd700" 
          emissive="#ffd700"
          emissiveIntensity={2}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Inner glow */}
      <Sphere args={[1.8, 32, 32]}>
        <meshBasicMaterial 
          color="#a3e635" 
          transparent 
          opacity={0.1}
        />
      </Sphere>
    </Float>
  );
};

// Floating Particle System
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    position: [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 5
    ] as [number, number, number],
    scale: Math.random() * 0.5 + 0.1
  }));

  return (
    <>
      {particles.map((particle) => (
        <Float key={particle.id} speed={2} rotationIntensity={1} floatIntensity={2}>
          <mesh position={particle.position}>
            <sphereGeometry args={[particle.scale, 8, 8]} />
            <meshStandardMaterial 
              color="#a3e635" 
              emissive="#a3e635"
              emissiveIntensity={1}
              transparent
              opacity={0.6}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
};

// Data Stream Lines
const DataStreams = () => {
  const streams = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 3;
    return {
      id: i,
      start: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number],
      end: [Math.cos(angle) * radius * 2, Math.sin(angle) * radius * 2, 0] as [number, number, number]
    };
  });

  return (
    <>
      {streams.map((stream) => (
        <Float key={stream.id} speed={3} rotationIntensity={0.5}>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...stream.start, ...stream.end])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#a3e635" opacity={0.3} transparent />
          </line>
        </Float>
      ))}
    </>
  );
};

// Main 3D Scene
export const Scene3D = () => {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={75} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#a3e635" />
        <spotLight position={[0, 10, 0]} intensity={1} angle={0.3} penumbra={1} color="#ffd700" />
        
        {/* Environment */}
        <Environment preset="night" />
        
        {/* Components */}
        <ColombiaGlobe />
        <FloatingParticles />
        <DataStreams />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxDistance={15}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
};
