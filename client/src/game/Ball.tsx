import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import BallPhysics from './physics/BallPhysics';
import { getBallTexture } from '../utils/ballTexture';

interface BallProps {
  number: number;
  color: string;
  position: [number, number, number];
}

// 1. REUSE GEOMETRY: Shared sphere geometry instantiated once at module scope
export const sphereGeometry = new THREE.SphereGeometry(0.18, 32, 32);

// 2. REUSE MATERIALS: Cached material instances mapped by ball number
const materialCache: Record<number, THREE.MeshStandardMaterial> = {};

export const getBallMaterial = (number: number): THREE.MeshStandardMaterial => {
  if (!materialCache[number]) {
    const texture = getBallTexture(number);
    materialCache[number] = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.45,
      metalness: 0.05,
      color: number === 0 ? '#b8b8b8' : '#a5a5a5',
    });
  }
  return materialCache[number];
};

export const Ball = forwardRef<RapierRigidBody, BallProps>(({ number, color, position }, ref) => {
  const ballMaterial = getBallMaterial(number);
  const localRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Expose the local rigid body ref to parent components
  useImperativeHandle(ref, () => localRef.current!);

  useFrame((state, delta) => {
    if (!localRef.current || !meshRef.current) return;

    try {
      if (!localRef.current.isValid()) return;

      const velocity = localRef.current.linvel();
      // Calculate 2D speed on the table plane
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

      if (speed > 0.01) {
        // Perfect rolling rotation logic:
        // Rolling angle = (speed * delta) / radius. Ball radius is 0.18.
        const radius = 0.18;
        const angle = (speed * delta) / radius;

        // Rotation axis is perpendicular to the motion direction in the XZ plane.
        // Motion direction is (vx, 0, vz). The perpendicular axis is (-vz, 0, vx).
        const axis = new THREE.Vector3(-velocity.z, 0, velocity.x).normalize();

        // Rotate the mesh around the calculated axis in world space
        meshRef.current.rotateOnWorldAxis(axis, angle);
      }
    } catch (e) {
      // Safe guard against physics state glitches
    }
  });

  return (
    <BallPhysics 
      ref={localRef} 
      position={position}
      userData={{ type: 'ball', ballId: number }}
    >
      {/* Explicitly apply the shared geometry and cached material with frustum culling enabled */}
      <mesh 
        ref={meshRef}
        castShadow 
        receiveShadow
        geometry={sphereGeometry}
        material={ballMaterial}
        frustumCulled={true}
      />
    </BallPhysics>
  );
});

Ball.displayName = 'Ball';
export default Ball;
