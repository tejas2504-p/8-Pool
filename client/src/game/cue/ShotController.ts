import * as THREE from 'three';
import { RapierRigidBody } from '@react-three/rapier';

export class ShotController {
  /**
   * Calculates the shot impulse vector and applies it to the cue ball
   */
  public static executeShot(
    cueBallRef: React.RefObject<RapierRigidBody | null>,
    power: number,
    aimAngle: number
  ): void {
    if (!cueBallRef.current || !cueBallRef.current.isValid()) return;

    // Target angle is opposite to cue position
    const angle = aimAngle - Math.PI;
    
    // Scaling impulse for realistic gameplay feel (power 100 => impulse 12)
    const forceMagnitude = power * 0.12;

    const impulse = new THREE.Vector3(
      Math.sin(angle) * forceMagnitude,
      0,
      Math.cos(angle) * forceMagnitude
    );

    cueBallRef.current.applyImpulse(impulse, true);
  }
}

export default ShotController;
