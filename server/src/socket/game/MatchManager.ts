import { AuthoritativeGameState, createInitialGameState, MatchStats } from './GameState';
import PhysicsSync from './PhysicsSync';
import RuleSync from './RuleSync';

export interface ShotLogEntry {
  shotNumber: number;
  shooterId: string;
  shooterRole: 'host' | 'guest';
  angle: number;
  power: number;
  timestamp: Date;
  ballsSnapshot: Array<{
    id: number;
    x: number;
    y: number;
    z: number;
    isActive: boolean;
  }>;
}

export class MatchManager {
  private state: AuthoritativeGameState;
  private hostUserId: string;
  private guestUserId: string;
  private shotLogs: ShotLogEntry[] = [];

  // Track match statistics
  private startTime: number = Date.now();
  private hostStats = { shotsPlayed: 0, successfulPots: 0, fouls: 0, longestPot: 0 };
  private guestStats = { shotsPlayed: 0, successfulPots: 0, fouls: 0, longestPot: 0 };

  // Tracks details for achievements
  private hostMaxCombo: number = 0;
  private guestMaxCombo: number = 0;
  private hostPocketedOnBreak: boolean = false;
  private guestPocketedOnBreak: boolean = false;

  constructor(roomId: string, hostUserId: string, guestUserId: string) {
    this.state = createInitialGameState(roomId);
    this.hostUserId = hostUserId;
    this.guestUserId = guestUserId;
  }

  public getHostUserId(): string {
    return this.hostUserId;
  }

  public getGuestUserId(): string {
    return this.guestUserId;
  }

  public getShotLogs(): ShotLogEntry[] {
    return this.shotLogs;
  }

  public getAchievementDetails() {
    return {
      hostFouls: this.hostStats.fouls,
      guestFouls: this.guestStats.fouls,
      hostPots: this.hostStats.successfulPots,
      guestPots: this.guestStats.successfulPots,
      hostMaxCombo: this.hostMaxCombo,
      guestMaxCombo: this.guestMaxCombo,
      hostPocketedOnBreak: this.hostPocketedOnBreak,
      guestPocketedOnBreak: this.guestPocketedOnBreak,
    };
  }

  /**
   * Returns the current MatchState.
   */
  public getState(): AuthoritativeGameState {
    return this.state;
  }

  /**
   * Authoritatively executes a shot intent on the server.
   * Validates player turn, runs physics sync simulation, and executes rules checks.
   */
  public executeShot(
    userId: string,
    angle: number,
    power: number
  ): { state: AuthoritativeGameState; error?: string } {
    const activePlayerRole = this.state.activePlayer;
    const expectedUserId = activePlayerRole === 'host' ? this.hostUserId : this.guestUserId;

    // 1. Enforce active turn verification
    if (userId !== expectedUserId) {
      return {
        state: this.state,
        error: 'It is not your turn to shoot',
      };
    }

    if (this.state.status === 'game-over') {
      return {
        state: this.state,
        error: 'The match has already concluded',
      };
    }

    // Record stats shot count
    const shooterStats = activePlayerRole === 'host' ? this.hostStats : this.guestStats;
    shooterStats.shotsPlayed += 1;

    // Transition status to playing
    this.state.status = 'playing';

    // Track break shot status before processing
    const isBreakShot = this.state.isFirstShot;

    // Save previous ball positions to measure pot distances and record replay snapshot
    const preShotBalls = JSON.parse(JSON.stringify(this.state.balls));

    this.shotLogs.push({
      shotNumber: this.shotLogs.length + 1,
      shooterId: userId,
      shooterRole: activePlayerRole,
      angle,
      power,
      timestamp: new Date(),
      ballsSnapshot: preShotBalls.map((b: any) => ({
        id: b.id,
        x: b.x,
        y: b.y,
        z: b.z,
        isActive: b.isActive,
      })),
    });

    // 2. Server-side physics simulation step
    const simulation = PhysicsSync.simulateShot(this.state, angle, power);

    // Apply coordinate updates
    this.state.balls = simulation.updatedBalls;

    // 3. Process rules outcomes (fouls, turn updates, wins)
    this.state = RuleSync.processShotResult(
      this.state,
      simulation.firstBallHit,
      simulation.pocketedBalls,
      simulation.isCueBallScratched,
      simulation.cushionHitsAfterContact
    );

    // Record fouls stats
    if (this.state.foulOccurred) {
      shooterStats.fouls += 1;
    }

    // Record successful pots and calculate longest pot distance
    const pocketedObjectBalls = simulation.pocketedBalls.filter((id) => id !== 0);
    if (pocketedObjectBalls.length > 0) {
      shooterStats.successfulPots += pocketedObjectBalls.length;

      // Track combo count achievement metrics
      if (activePlayerRole === 'host') {
        this.hostMaxCombo = Math.max(this.hostMaxCombo, pocketedObjectBalls.length);
      } else {
        this.guestMaxCombo = Math.max(this.guestMaxCombo, pocketedObjectBalls.length);
      }

      // Track break master metrics
      if (isBreakShot) {
        if (activePlayerRole === 'host') {
          this.hostPocketedOnBreak = true;
        } else {
          this.guestPocketedOnBreak = true;
        }
      }

      const pockets = [
        { x: -5.4, z: -2.4 }, { x: 5.4, z: -2.4 },
        { x: -5.4, z: 2.4 }, { x: 5.4, z: 2.4 },
        { x: 0, z: -2.4 }, { x: 0, z: 2.4 }
      ];

      pocketedObjectBalls.forEach((bId) => {
        const initialBall = preShotBalls.find((b: any) => b.id === bId);
        if (initialBall) {
          // Find the pocket closest to the ball's ending position (where it was pocketed)
          let minDistance = Infinity;
          pockets.forEach((p) => {
            const dx = initialBall.x - p.x;
            const dz = initialBall.z - p.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < minDistance) {
              minDistance = d;
            }
          });
          if (minDistance > shooterStats.longestPot) {
            shooterStats.longestPot = parseFloat(minDistance.toFixed(2));
          }
        }
      });
    }

    // 4. Generate final MatchStats if match is over
    if (this.state.status === 'game-over') {
      const hostAccuracy = this.hostStats.shotsPlayed > 0 
        ? Math.round((this.hostStats.successfulPots / this.hostStats.shotsPlayed) * 100) 
        : 0;
      const guestAccuracy = this.guestStats.shotsPlayed > 0 
        ? Math.round((this.guestStats.successfulPots / this.guestStats.shotsPlayed) * 100) 
        : 0;

      const finalStats: MatchStats = {
        gameDuration: Math.round((Date.now() - this.startTime) / 1000),
        winner: this.state.winner,
        host: {
          ...this.hostStats,
          accuracy: hostAccuracy,
          unlockedAchievements: [],
        },
        guest: {
          ...this.guestStats,
          accuracy: guestAccuracy,
          unlockedAchievements: [],
        }
      };

      this.state.stats = finalStats;
    }

    return { state: this.state };
  }
}
