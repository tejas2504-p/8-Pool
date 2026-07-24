import { MatchState } from '../rules/MatchState';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

export interface AiShotDecision {
  targetBallId: number;
  angle: number;
  power: number;
  pocketName: string;
}

const POCKETS = [
  { name: 'Top-Left', x: -5.4, z: -2.4 },
  { name: 'Top-Right', x: 5.4, z: -2.4 },
  { name: 'Bottom-Left', x: -5.4, z: 2.4 },
  { name: 'Bottom-Right', x: 5.4, z: 2.4 },
  { name: 'Side-Top', x: 0.0, z: -2.52 },
  { name: 'Side-Bottom', x: 0.0, z: 2.52 },
];

export class AiAgent {
  /**
   * Calculates the best shot decision for the AI bot based on physics heuristics and difficulty.
   */
  public static calculateShot(
    matchState: MatchState,
    cueBallPos: { x: number; z: number },
    objectBalls: Array<{ id: number; x: number; z: number; isActive: boolean }>,
    difficulty: AiDifficulty
  ): AiShotDecision {
    const isHost = matchState.activePlayer === 'host';
    const aiGroup = isHost ? matchState.hostGroup : matchState.guestGroup;

    // Filter active object balls
    const activeBalls = objectBalls.filter((b) => b.isActive && b.id !== 0);

    // Determine legal target ball IDs
    let legalBallIds: number[] = [];

    if (aiGroup === 'solids') {
      legalBallIds = activeBalls.filter((b) => b.id >= 1 && b.id <= 7).map((b) => b.id);
      if (legalBallIds.length === 0) legalBallIds = [8];
    } else if (aiGroup === 'stripes') {
      legalBallIds = activeBalls.filter((b) => b.id >= 9 && b.id <= 15).map((b) => b.id);
      if (legalBallIds.length === 0) legalBallIds = [8];
    } else {
      // Open table: any ball 1-15 (exclude 8 unless it's the last ball remaining)
      const nonEight = activeBalls.filter((b) => b.id !== 8).map((b) => b.id);
      legalBallIds = nonEight.length > 0 ? nonEight : [8];
    }

    const candidateShots: Array<{
      targetBallId: number;
      angle: number;
      power: number;
      pocketName: string;
      score: number;
    }> = [];

    const BALL_RADIUS = 0.18;

    // Evaluate all combinations of legal target balls & 6 pockets
    activeBalls
      .filter((b) => legalBallIds.includes(b.id))
      .forEach((targetBall) => {
        POCKETS.forEach((pocket) => {
          // Vector from target ball to pocket
          const toPocketX = pocket.x - targetBall.x;
          const toPocketZ = pocket.z - targetBall.z;
          const distToPocket = Math.sqrt(toPocketX * toPocketX + toPocketZ * toPocketZ);

          if (distToPocket < 0.001) return;

          const pocketDirX = toPocketX / distToPocket;
          const pocketDirZ = toPocketZ / distToPocket;

          // Ghost ball contact center position
          const ghostX = targetBall.x - pocketDirX * (2 * BALL_RADIUS);
          const ghostZ = targetBall.z - pocketDirZ * (2 * BALL_RADIUS);

          // Vector from cue ball to ghost center
          const toGhostX = ghostX - cueBallPos.x;
          const toGhostZ = ghostZ - cueBallPos.z;
          const distCueToGhost = Math.sqrt(toGhostX * toGhostX + toGhostZ * toGhostZ);

          if (distCueToGhost < 0.001) return;

          const cueDirX = toGhostX / distCueToGhost;
          const cueDirZ = toGhostZ / distCueToGhost;

          // Alignment dot product (1.0 = direct straight-in shot)
          const alignment = cueDirX * pocketDirX + cueDirZ * pocketDirZ;

          // Only consider shots with reasonable contact angles (> 0.2 dot product)
          if (alignment > 0.15) {
            // Raw aim angle for cue stick
            const rawAngle = Math.atan2(toGhostX, toGhostZ) + Math.PI;

            // Power heuristic based on distance
            const calculatedPower = Math.min(Math.max(distCueToGhost * 12 + distToPocket * 8 + 25, 30), 85);

            // Heuristic Score: higher alignment + shorter distances = better shot
            const score = alignment * 100 - distCueToGhost * 5 - distToPocket * 3;

            candidateShots.push({
              targetBallId: targetBall.id,
              angle: rawAngle,
              power: calculatedPower,
              pocketName: pocket.name,
              score,
            });
          }
        });
      });

    // Fallback if no clear line-of-sight candidate found: aim at first active legal ball
    if (candidateShots.length === 0) {
      const firstBall = activeBalls.find((b) => legalBallIds.includes(b.id)) || activeBalls[0];
      const dx = (firstBall ? firstBall.x : 0) - cueBallPos.x;
      const dz = (firstBall ? firstBall.z : 0) - cueBallPos.z;
      const fallbackAngle = Math.atan2(dx, dz) + Math.PI;

      return {
        targetBallId: firstBall ? firstBall.id : 1,
        angle: fallbackAngle,
        power: 50,
        pocketName: 'Direct Hit',
      };
    }

    // Sort candidates by score descending
    candidateShots.sort((a, b) => b.score - a.score);

    // Pick shot based on difficulty level
    let chosen = candidateShots[0];
    let angleNoise = 0;

    if (difficulty === 'easy') {
      // Pick a random shot from top candidates + add noise (+- 0.15 rad)
      const randomIdx = Math.floor(Math.random() * candidateShots.length);
      chosen = candidateShots[randomIdx];
      angleNoise = (Math.random() - 0.5) * 0.3; // +- 0.15 rad
    } else if (difficulty === 'medium') {
      // Pick from top 2 candidates + small noise (+- 0.04 rad)
      const topIdx = Math.floor(Math.random() * Math.min(2, candidateShots.length));
      chosen = candidateShots[topIdx];
      angleNoise = (Math.random() - 0.5) * 0.08; // +- 0.04 rad
    } else {
      // Hard: Pick best candidate + minimal noise (+- 0.005 rad)
      chosen = candidateShots[0];
      angleNoise = (Math.random() - 0.5) * 0.01;
    }

    return {
      targetBallId: chosen.targetBallId,
      angle: chosen.angle + angleNoise,
      power: Math.round(chosen.power),
      pocketName: chosen.pocketName,
    };
  }
}

export default AiAgent;
