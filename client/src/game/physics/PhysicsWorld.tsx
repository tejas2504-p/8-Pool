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
      allowedLinearError={PhysicsConstants.ALLOWED_LINEAR_ERROR}
      contactNaturalFrequency={PhysicsConstants.CONTACT_NATURAL_FREQUENCY}
      timeStep={1 / 60}
      interpolate={true}
    >
      {children}
    </Physics>
  );
};

export default PhysicsWorld;
