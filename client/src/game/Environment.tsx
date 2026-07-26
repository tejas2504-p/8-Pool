import React from 'react';
import { Environment as DreiEnvironment } from '@react-three/drei';

export const Environment: React.FC = () => {
  const slatsX = [-16, -15.2, -14.4, -13.6, -12.8, -12, -11.2, -10.4, -9.6, -8.8, 8.8, 9.6, 10.4, 11.2, 12, 12.8, 13.6, 14.4, 15.2, 16];

  return (
    <>
      {/* Dark Ambient background */}
      <color attach="background" args={['#121214']} />

      {/* Atmospheric Room Lights */}
      {/* Soft Cool-White Back Wall Glow */}
      <pointLight position={[0, 4, -15]} color="#ffffff" intensity={1.8} distance={22} decay={2} />
      {/* Soft Cool-White Front Wall Glow */}
      <pointLight position={[0, 4, 15]} color="#ffffff" intensity={1.8} distance={22} decay={2} />
      {/* Soft Silver Left Wall Glow */}
      <pointLight position={[-15, 3, 0]} color="#cbd5e1" intensity={1.2} distance={18} decay={2} />
      {/* Warm Silver Right Wall Glow */}
      <pointLight position={[15, 3, 0]} color="#e2e8f0" intensity={1.2} distance={18} decay={2} />
      
      {/* ─── ROOM STRUCTURE (40 x 40 x 10 Closed Box) ─── */}

      {/* Floor: Glossy Dark Grey Tiles */}
      <mesh receiveShadow position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2d2d30" roughness={0.25} metalness={0.1} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#18181b" roughness={0.9} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 2, -20]}>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color="#1f1f22" roughness={0.8} />
      </mesh>

      {/* Front Wall */}
      <mesh position={[0, 2, 20]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color="#1f1f22" roughness={0.8} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-20, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color="#27272a" roughness={0.85} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[20, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color="#27272a" roughness={0.85} />
      </mesh>

      {/* ─── WALL DECORATIONS & LED STRIPS ─── */}

      {/* Back Wall Slat Panels */}
      {slatsX.map((x, i) => (
        <mesh key={`slat-back-${i}`} position={[x, 2, -19.9]}>
          <boxGeometry args={[0.4, 10, 0.1]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.7} />
        </mesh>
      ))}

      {/* Back Wall Center Accent Steel Panel */}
      <mesh position={[0, 2, -19.85]}>
        <boxGeometry args={[14, 10, 0.15]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.85} />
      </mesh>

      {/* Back Wall Flanking vertical LED strips */}
      {/* White Strip (Left Side of wood panel) */}
      <mesh position={[-7.1, 2, -19.75]}>
        <boxGeometry args={[0.08, 10, 0.08]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {/* White Strip (Right Side of wood panel) */}
      <mesh position={[7.1, 2, -19.75]}>
        <boxGeometry args={[0.08, 10, 0.08]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>


      {/* Front Wall Slat Panels */}
      {slatsX.map((x, i) => (
        <mesh key={`slat-front-${i}`} position={[x, 2, 19.9]}>
          <boxGeometry args={[0.4, 10, 0.1]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.7} />
        </mesh>
      ))}

      {/* Front Wall Center Accent Steel Panel */}
      <mesh position={[0, 2, 19.85]}>
        <boxGeometry args={[14, 10, 0.15]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.85} />
      </mesh>

      {/* Front Wall Flanking vertical LED strips */}
      {/* White Strip (Left Side of wood panel) */}
      <mesh position={[-7.1, 2, 19.75]}>
        <boxGeometry args={[0.08, 10, 0.08]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {/* White Strip (Right Side of wood panel) */}
      <mesh position={[7.1, 2, 19.75]}>
        <boxGeometry args={[0.08, 10, 0.08]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>


      {/* Side Wall Horizontal LED Accent Lines */}
      {/* Left Wall White Line */}
      <mesh position={[-19.9, 2, 0]}>
        <boxGeometry args={[0.06, 0.08, 40]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {/* Right Wall White Line */}
      <mesh position={[19.9, 2, 0]}>
        <boxGeometry args={[0.06, 0.08, 40]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* HDR environment preset for high-fidelity specular reflections and ambient probe fills */}
      <DreiEnvironment preset="studio" />
    </>
  );
};

export default Environment;
