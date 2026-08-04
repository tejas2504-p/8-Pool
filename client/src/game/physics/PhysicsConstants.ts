export const PhysicsConstants = {
  // Ball specifications
  BALL_RADIUS: 0.18,
  BALL_MASS: 1.0,
  BALL_RESTITUTION: 0.96, // Realistic phenolic resin elastic collisions (92%-98%)
  BALL_FRICTION: 0.08, // Phenolic resin ball-to-ball friction (0.03-0.08)
  BALL_LINEAR_DAMPING: 0.15, // Smooth rolling resistance on professional fast felt (Simonis 860)
  BALL_ANGULAR_DAMPING: 0.20, // Spin decay rate allowing advanced draw/follow/sidespin (english)

  // Table felt & cushions
  TABLE_FRICTION: 0.25, // Sliding friction on cloth to generate torque for rolling (0.15-0.40)
  CUSHION_RESTITUTION: 0.82, // Professional lively gum rubber cushions (80%-90%)
  CUSHION_FRICTION: 0.14, // Friction along rails (0.12-0.15)

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
