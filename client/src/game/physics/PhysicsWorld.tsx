import React, { ReactNode } from 'react';
import { Physics } from '@react-three/rapier';
import { PhysicsConstants } from './PhysicsConstants';

interface PhysicsWorldProps {
  children: ReactNode;
}

export const PhysicsWorld: React.FC<PhysicsWorldProps> = ({ children }) => {
  return (
    <Physics 
      gravity={[0, -9.81, 0]}
      numSolverIterations={PhysicsConstants.SOLVER_ITERATIONS}
      numInternalPgsIterations={PhysicsConstants.INTERNAL_PGS_ITERATIONS}
      maxCcdSubsteps={PhysicsConstants.MAX_CCD_SUBSTEPS}
    >
      {children}
    </Physics>
  );
};

export default PhysicsWorld;
