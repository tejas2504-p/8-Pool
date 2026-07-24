import { RapierRigidBody } from '@react-three/rapier';
import { GameManager, MatchState } from '../rules';

export interface BallState {
  id: number;
  x: number;
  y: number;
  z: number;
  isActive: boolean;
}

export class GameSynchronizer {
  /**
   * Synchronizes 3D ball rigid bodies with authoritative server coordinates.
   */
  public static syncBalls(
    balls: BallState[],
    turnState: string,
    ballRefs: React.MutableRefObject<Map<number, RapierRigidBody>>
  ): void {
    balls.forEach((sBall) => {
      const body = ballRefs.current.get(sBall.id);
      if (body && body.isValid()) {
        if (!sBall.isActive) {
          // Relocate pocketed/inactive balls off-slate
          body.setTranslation({ x: 100 + sBall.id, y: -10, z: 100 }, true);
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        } else if (turnState === 'idle') {
          // Snap coordinates only when balls are stationary
          body.setTranslation({ x: sBall.x, y: sBall.y, z: sBall.z }, true);
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
    });
  }

  /**
   * Synchronizes client-side GameManager with the server-side authoritative state snapshot.
   */
  public static syncMatchState(
    serverState: MatchState,
    gameManager: GameManager
  ): void {
    gameManager.syncServerState(serverState);
  }
}

export default GameSynchronizer;
