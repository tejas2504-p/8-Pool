import React from 'react';
import { RapierRigidBody } from '@react-three/rapier';
import Ball from './Ball';
import { PhysicsConstants } from './physics/PhysicsConstants';
import { BALL_COLORS } from '../utils/ballTexture';

interface BallsProps {
  activeBalls: number[];
  cueBallRef: React.RefObject<RapierRigidBody | null>;
  ballRefs: React.MutableRefObject<Map<number, RapierRigidBody>>;
}

const BALL_CONFIGS = [
  { number: 0, color: BALL_COLORS[0], position: PhysicsConstants.CUE_BALL_SPAWN },
  { number: 1, color: BALL_COLORS[1], position: [1.8, 0.28, 0] as [number, number, number] },
  { number: 9, color: BALL_COLORS[9], position: [2.112, 0.28, -0.18] as [number, number, number] },
  { number: 2, color: BALL_COLORS[2], position: [2.112, 0.28, 0.18] as [number, number, number] },
  { number: 10, color: BALL_COLORS[10], position: [2.424, 0.28, -0.36] as [number, number, number] },
  { number: 8, color: BALL_COLORS[8], position: [2.424, 0.28, 0] as [number, number, number] },
  { number: 3, color: BALL_COLORS[3], position: [2.424, 0.28, 0.36] as [number, number, number] },
  { number: 11, color: BALL_COLORS[11], position: [2.736, 0.28, -0.54] as [number, number, number] },
  { number: 4, color: BALL_COLORS[4], position: [2.736, 0.28, -0.18] as [number, number, number] },
  { number: 12, color: BALL_COLORS[12], position: [2.736, 0.28, 0.18] as [number, number, number] },
  { number: 5, color: BALL_COLORS[5], position: [2.736, 0.28, 0.54] as [number, number, number] },
  { number: 7, color: BALL_COLORS[7], position: [3.048, 0.28, -0.72] as [number, number, number] },
  { number: 6, color: BALL_COLORS[6], position: [3.048, 0.28, -0.36] as [number, number, number] },
  { number: 14, color: BALL_COLORS[14], position: [3.048, 0.28, 0] as [number, number, number] },
  { number: 13, color: BALL_COLORS[13], position: [3.048, 0.28, 0.36] as [number, number, number] },
  { number: 15, color: BALL_COLORS[15], position: [3.048, 0.28, 0.72] as [number, number, number] },
];

export const Balls: React.FC<BallsProps> = ({ activeBalls, cueBallRef, ballRefs }) => {
  return (
    <group>
      {BALL_CONFIGS.map((config) => {
        if (!activeBalls.includes(config.number)) return null;
        
        return (
          <Ball
            key={config.number}
            number={config.number}
            color={config.color}
            position={config.position}
            ref={(node) => {
              if (config.number === 0) {
                // Assign to cueBallRef
                (cueBallRef as any).current = node;
              } else {
                // Assign to ballRefs map
                if (node) {
                  ballRefs.current.set(config.number, node);
                } else {
                  ballRefs.current.delete(config.number);
                }
              }
            }}
          />
        );
      })}
    </group>
  );
};

export default Balls;
