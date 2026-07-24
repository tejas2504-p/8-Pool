import React from 'react';
import { Environment as DreiEnvironment } from '@react-three/drei';

export const Environment: React.FC = () => {
  return (
    <>
      {/* Dark Ambient background */}
      <color attach="background" args={['#09090b']} />

      {/* Atmospheric Room Lights */}
      {/* Soft Purple Back Wall Glow */}
      <pointLight position={[0, 4, -8]} color="#a855f7" intensity={1.5} distance={15} decay={2} />
      {/* Cool Cyan Left Wall Glow */}
      <pointLight position={[-12, 3, 0]} color="#00f0ff" intensity={1.0} distance={12} decay={2} />
      {/* Neon Magenta Right Wall Glow */}
      <pointLight position={[12, 3, 0]} color="#d946ef" intensity={1.0} distance={12} decay={2} />
      
      {/* ─── ROOM STRUCTURE ─── */}

      {/* Floor: Glossy Dark Grey Tiles */}
      <mesh receiveShadow position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color="#111827" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 32]} />
        <meshStandardMaterial color="#09090b" roughness={0.9} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2, -12]}>
        <planeGeometry args={[32, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-16, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[32, 10]} />
        <meshStandardMaterial color="#0b1329" roughness={0.85} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[16, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[32, 10]} />
        <meshStandardMaterial color="#0b1329" roughness={0.85} />
      </mesh>

      {/* ─── WALL DECORATIONS & LED STRIPS ─── */}

      {/* Back Wall Accent Slat Panels (Left & Right of center) */}
      {[-12, -11.2, -10.4, -9.6, -8.8].map((x, i) => (
        <mesh key={`slat-l-${i}`} position={[x, 2, -11.9]}>
          <boxGeometry args={[0.4, 10, 0.1]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
        </mesh>
      ))}
      {[8.8, 9.6, 10.4, 11.2, 12].map((x, i) => (
        <mesh key={`slat-r-${i}`} position={[x, 2, -11.9]}>
          <boxGeometry args={[0.4, 10, 0.1]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
        </mesh>
      ))}

      {/* Back Wall Center Dark Wood Panel */}
      <mesh position={[0, 2, -11.8]}>
        <boxGeometry args={[14, 10, 0.15]} />
        <meshStandardMaterial color="#2d150b" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Neon Flanking vertical LED strips */}
      {/* Cyan Strip (Left Side of wood panel) */}
      <mesh position={[-7.1, 2, -11.7]}>
        <boxGeometry args={[0.08, 10, 0.08]} />
        <meshBasicMaterial color="#00f0ff" toneMapped={false} />
      </mesh>
      {/* Magenta Strip (Right Side of wood panel) */}
      <mesh position={[7.1, 2, -11.7]}>
        <boxGeometry args={[0.08, 10, 0.08]} />
        <meshBasicMaterial color="#d946ef" toneMapped={false} />
      </mesh>

      {/* Side Wall Horizontal LED Accent Lines */}
      {/* Left Wall Cyan Line */}
      <mesh position={[-15.9, 2, 0]}>
        <boxGeometry args={[0.06, 0.08, 24]} />
        <meshBasicMaterial color="#00f0ff" toneMapped={false} />
      </mesh>
      {/* Right Wall Magenta Line */}
      <mesh position={[15.9, 2, 0]}>
        <boxGeometry args={[0.06, 0.08, 24]} />
        <meshBasicMaterial color="#d946ef" toneMapped={false} />
      </mesh>

      {/* HDR environment preset for high-fidelity specular reflections and ambient probe fills */}
      <DreiEnvironment preset="studio" />
    </>
  );
};

export default Environment;
