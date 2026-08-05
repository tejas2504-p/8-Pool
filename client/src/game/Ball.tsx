import React, { forwardRef } from 'react';
import * as THREE from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import BallPhysics from './physics/BallPhysics';
import { PhysicsConstants } from './physics/PhysicsConstants';
import { getBallTexture } from '../utils/ballTexture';

interface BallProps {
  number: number;
  color: string;
  position: [number, number, number];
}

// 1. REUSE GEOMETRY: Shared sphere geometry instantiated once at module scope
export const sphereGeometry = new THREE.SphereGeometry(PhysicsConstants.BALL_RADIUS, 32, 32);

// 2. REUSE MATERIALS: Cached material instances mapped by ball number
const materialCache: Record<number, THREE.MeshStandardMaterial> = {};

export const getBallMaterial = (number: number): THREE.MeshStandardMaterial => {
  if (!materialCache[number]) {
    const texture = getBallTexture(number);
    materialCache[number] = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.08, // Highly polished glossy resin surface
      metalness: 0.02, // Clean specular reflections without metallic darkening
      color: '#ffffff', // Render textures at full, vibrant color fidelity
    });
  }
  return materialCache[number];
};

export const Ball = forwardRef<RapierRigidBody, BallProps>(({ number, color, position }, ref) => {
  const ballMaterial = getBallMaterial(number);

  return (
    <BallPhysics 
      ref={ref} 
      position={position}
      userData={{ type: 'ball', ballId: number }}
    >
      {/* Explicitly apply the shared geometry and cached material with frustum culling enabled */}
      <mesh 
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
