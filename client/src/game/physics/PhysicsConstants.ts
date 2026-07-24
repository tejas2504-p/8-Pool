export const PhysicsConstants = {
  // Ball specifications
  BALL_RADIUS: 0.18,
  BALL_MASS: 1.0,
  BALL_RESTITUTION: 0.8, // Elasticity of ball-to-ball collisions
  BALL_FRICTION: 0.05, // Surface slide friction
  BALL_LINEAR_DAMPING: 0.6, // Rolling resistance simulation (deceleration)
  BALL_ANGULAR_DAMPING: 0.6, // Spin drag simulation

  // Table boundaries & cushions
  CUSHION_RESTITUTION: 0.75, // Bounciness of pool table rails
  CUSHION_FRICTION: 0.1, // Friction along rails

  // Pocket coordinates matching the visual table structure (scaled by 1.2x)
  // Corner pockets have radius 0.26, side/middle pockets have radius 0.24
  POCKETS: [
    { id: 'top-left', position: [-5.76, 0.11, -2.76] as [number, number, number], radius: 0.26 },
    { id: 'top-right', position: [5.76, 0.11, -2.76] as [number, number, number], radius: 0.26 },
    { id: 'bottom-left', position: [-5.76, 0.11, 2.76] as [number, number, number], radius: 0.26 },
    { id: 'bottom-right', position: [5.76, 0.11, 2.76] as [number, number, number], radius: 0.26 },
    { id: 'top-middle', position: [0, 0.11, -2.88] as [number, number, number], radius: 0.24 },
    { id: 'bottom-middle', position: [0, 0.11, 2.88] as [number, number, number], radius: 0.24 },
  ],

  CUE_BALL_SPAWN: [-3.0, 0.28, 0] as [number, number, number],
};

export default PhysicsConstants;
