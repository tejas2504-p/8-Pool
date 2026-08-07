import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import gsap from 'gsap';

interface CameraControllerProps {
  cueBallRef: React.RefObject<RapierRigidBody | null>;
  enabled?: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({ cueBallRef, enabled = true }) => {
  const orbitControlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useEffect(() => {
    if (cameraRef.current) {
      // Dramatic camera sweep on match start
      gsap.fromTo(
        cameraRef.current.position,
        { x: 12, y: 12, z: 15 },
        { x: 0, y: 6, z: 7, duration: 2.5, ease: 'power2.out' }
      );
    }
  }, []);

  useFrame(() => {
    if (!cueBallRef.current || !cueBallRef.current.isValid() || !orbitControlsRef.current) return;

    let translation;
    try {
      translation = cueBallRef.current.translation();
    } catch (e) {
      return;
    }
    
    // Ignore updates if the cue ball is pocketed/scratched and teleported deep under the table Y=-10
    if (translation.y < -2) return;

    const targetPos = new THREE.Vector3(translation.x, 0.28, translation.z);

    // Smoothly lerp camera focus (target) to track the cue ball cinematically
    orbitControlsRef.current.target.lerp(targetPos, 0.08);
    orbitControlsRef.current.update();
  });

  return (
    <>
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        position={[0, 6, 7]} 
        fov={45} 
      />
      <OrbitControls 
        ref={orbitControlsRef}
        enabled={enabled}
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={4} 
        maxDistance={25} 
        enableDamping
        dampingFactor={0.05}
        mouseButtons={{
          LEFT: -1 as any, // Disable left-click camera rotation (used for pulling stick back)
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE, // Use right-click to orbit camera
        }}
      />
    </>
  );
};

export default CameraController;
