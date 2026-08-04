import React, { ReactNode } from 'react';
import { Physics } from '@react-three/rapier';

interface PhysicsWorldProps {
  children: ReactNode;
}

export const PhysicsWorld: React.FC<PhysicsWorldProps> = ({ children }) => {
  return (
    <Physics 
      gravity={[0, -9.81, 0]}
      numSolverIterations={12}
      numInternalPgsIterations={4}
      maxCcdSubsteps={8}
    >
      {children}
    </Physics>
  );
};

export default PhysicsWorld;
