import React from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { PhysicsConstants } from './PhysicsConstants';

export const TablePhysics: React.FC = () => {
  return (
    <group>
      {/* Table Bed (Slate) Static Collider (scaled by 1.2x) */}
      {/* Size is [12, 0.2, 6], positioned at [0, 0, 0]. The top face is at Y = 0.1 */}
      <RigidBody type="fixed" friction={PhysicsConstants.BALL_FRICTION} restitution={0.1}>
        <CuboidCollider args={[6, 0.1, 3]} position={[0, 0, 0]} />
      </RigidBody>

      {/* Cushion/Rail Static Colliders (scaled by 1.2x) */}
      {/* Restitution (bounciness) and friction are higher for cushions */}
      <RigidBody 
        type="fixed" 
        restitution={PhysicsConstants.CUSHION_RESTITUTION} 
        friction={PhysicsConstants.CUSHION_FRICTION}
      >
        {/* Top-Left Rail Segment */}
        {/* Collider half-sizes: X=2.52, Y=0.2, Z=0.2. Centered at [-2.88, 0.2, -3.2] */}
        <CuboidCollider args={[2.52, 0.2, 0.2]} position={[-2.88, 0.2, -3.2]} />

        {/* Top-Right Rail Segment */}
        <CuboidCollider args={[2.52, 0.2, 0.2]} position={[2.88, 0.2, -3.2]} />

        {/* Bottom-Left Rail Segment */}
        <CuboidCollider args={[2.52, 0.2, 0.2]} position={[-2.88, 0.2, 3.2]} />

        {/* Bottom-Right Rail Segment */}
        <CuboidCollider args={[2.52, 0.2, 0.2]} position={[2.88, 0.2, 3.2]} />

        {/* Left Rail (X = -6.2, Z from -2.4 to 2.4) */}
        {/* Collider half-sizes: X=0.2, Y=0.2, Z=2.4. Centered at [-6.2, 0.2, 0] */}
        <CuboidCollider args={[0.2, 0.2, 2.4]} position={[-6.2, 0.2, 0]} />

        {/* Right Rail (X = 6.2, Z from -2.4 to 2.4) */}
        <CuboidCollider args={[0.2, 0.2, 2.4]} position={[6.2, 0.2, 0]} />
      </RigidBody>
    </group>
  );
};

export default TablePhysics;
