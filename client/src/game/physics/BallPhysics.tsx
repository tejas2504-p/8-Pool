import React, { forwardRef, ReactNode } from 'react';
import { RigidBody, RapierRigidBody, RigidBodyProps } from '@react-three/rapier';
import { PhysicsConstants } from './PhysicsConstants';
import { collisionManager } from './CollisionManager';

interface BallPhysicsProps extends Omit<RigidBodyProps, 'ref'> {
  children: ReactNode;
}

export const BallPhysics = forwardRef<RapierRigidBody, BallPhysicsProps>(
  ({ children, position, onCollisionEnter, ...props }, ref) => {
    return (
      <RigidBody
        ref={ref}
        type="dynamic"
        colliders="ball"
        position={position}
        mass={PhysicsConstants.BALL_MASS}
        restitution={PhysicsConstants.BALL_RESTITUTION}
        friction={PhysicsConstants.BALL_FRICTION}
        linearDamping={PhysicsConstants.BALL_LINEAR_DAMPING}
        angularDamping={PhysicsConstants.BALL_ANGULAR_DAMPING}
        enabledTranslations={[true, false, true]}
        onCollisionEnter={(event) => {
          // Route collision to manager
          const otherBody = event.other.rigidBodyObject;
          const isOtherBall = otherBody && otherBody.userData && otherBody.userData.type === 'ball';
          const collisionType = isOtherBall ? 'ball-ball' : 'ball-cushion';
          collisionManager.handleCollision(event, collisionType);
          
          // Execute passed-in callbacks if any
          if (onCollisionEnter) {
            onCollisionEnter(event);
          }
        }}
        {...props}
      >
        {children}
      </RigidBody>
    );
  }
);

BallPhysics.displayName = 'BallPhysics';
export default BallPhysics;
