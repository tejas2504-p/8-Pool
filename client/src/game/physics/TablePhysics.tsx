import React from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { PhysicsConstants } from './PhysicsConstants';

export const TablePhysics: React.FC = () => {
  return (
    <group>
      {/* Table Bed (Slate) Static Collider (scaled by 1.2x) */}
      {/* Size is [14.4, 0.2, 7.2], positioned at [0, 0, 0]. The top face is at Y = 0.1 */}
      <RigidBody type="fixed" friction={PhysicsConstants.BALL_FRICTION} restitution={0.1}>
        <CuboidCollider args={[7.2, 0.1, 3.6]} position={[0, 0, 0]} />
      </RigidBody>

      {/* Cushion/Rail Static Colliders (scaled by 1.2x) */}
      {/* Restitution (bounciness) and friction are higher for cushions */}
      <RigidBody 
        type="fixed" 
        restitution={PhysicsConstants.CUSHION_RESTITUTION} 
        friction={PhysicsConstants.CUSHION_FRICTION}
      >
        {/* Top-Left Rail Segment */}
        {/* Collider half-sizes: X=3.024, Y=0.2, Z=0.24. Centered at [-3.456, 0.2, -3.84] */}
        <CuboidCollider args={[3.024, 0.2, 0.24]} position={[-3.456, 0.2, -3.84]} />

        {/* Top-Right Rail Segment */}
        <CuboidCollider args={[3.024, 0.2, 0.24]} position={[3.456, 0.2, -3.84]} />

        {/* Bottom-Left Rail Segment */}
        <CuboidCollider args={[3.024, 0.2, 0.24]} position={[-3.456, 0.2, 3.84]} />

        {/* Bottom-Right Rail Segment */}
        <CuboidCollider args={[3.024, 0.2, 0.24]} position={[3.456, 0.2, 3.84]} />

        {/* Left Rail (X = -7.44, Z from -2.88 to 2.88) */}
        {/* Collider half-sizes: X=0.24, Y=0.2, Z=2.88. Centered at [-7.44, 0.2, 0] */}
        <CuboidCollider args={[0.24, 0.2, 2.88]} position={[-7.44, 0.2, 0]} />

        {/* Right Rail (X = 7.44, Z from -2.88 to 2.88) */}
        <CuboidCollider args={[0.24, 0.2, 2.88]} position={[7.44, 0.2, 0]} />
      </RigidBody>
    </group>
  );
};

export default TablePhysics;
