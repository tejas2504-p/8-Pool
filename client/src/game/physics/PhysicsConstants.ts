export const PhysicsConstants = {
  // Ball specifications
  BALL_RADIUS: 0.18,
  BALL_MASS: 0.17, // Realistic Aramith tournament ball mass (~170g / 6oz)
  BALL_RESTITUTION: 0.96, // Realistic phenolic resin elastic collisions (92%-98%)
  BALL_FRICTION: 0.06, // Phenolic resin ball-to-ball friction (0.03-0.08)
  BALL_LINEAR_DAMPING: 0.08, // Deceleration representing rolling resistance on professional fast felt (Simonis 860)
  BALL_ANGULAR_DAMPING: 0.15, // Spin decay rate allowing advanced draw/follow/sidespin (english) to persist realistically

  // Table felt & cushions
  TABLE_FRICTION: 0.20, // Sliding kinetic friction on cloth to generate torque for rolling (0.15-0.40)
  CUSHION_RESTITUTION: 0.72, // Professional lively gum rubber cushions rebound (70%-80%)
  CUSHION_FRICTION: 0.14, // Friction along rails (0.12-0.15)

  // Custom sleeping thresholds (to bring slow sliding/rolling to a clean halt)
  SLEEP_LINEAR_THRESHOLD: 0.06, // Linear velocity below which ball is forced to sleep (m/s)
  SLEEP_ANGULAR_THRESHOLD: 0.10, // Spin velocity below which ball spin is zeroed out (rad/s)

  // Simulation / Solver parameters
  SOLVER_ITERATIONS: 20, // High solver iterations for precise contact resolution, preventing overlap
  INTERNAL_PGS_ITERATIONS: 8, // PGS iterations for contact stability
  MAX_CCD_SUBSTEPS: 10, // Continuous Collision Detection substeps to prevent tunneling at high speeds

  // Pocket coordinates matching the visual table structure (scaled by 1.2x)
  // Corner pockets have radius 0.312, side/middle pockets have radius 0.288
  POCKETS: [
    { id: 'top-left', position: [-6.912, 0.11, -3.312] as [number, number, number], radius: 0.312 },
    { id: 'top-right', position: [6.912, 0.11, -3.312] as [number, number, number], radius: 0.312 },
    { id: 'bottom-left', position: [-6.912, 0.11, 3.312] as [number, number, number], radius: 0.312 },
    { id: 'bottom-right', position: [6.912, 0.11, 3.312] as [number, number, number], radius: 0.312 },
    { id: 'top-middle', position: [0, 0.11, -3.456] as [number, number, number], radius: 0.288 },
    { id: 'bottom-middle', position: [0, 0.11, 3.456] as [number, number, number], radius: 0.288 },
  ],

  CUE_BALL_SPAWN: [-3.6, 0.28, 0] as [number, number, number],
};

export default PhysicsConstants;
