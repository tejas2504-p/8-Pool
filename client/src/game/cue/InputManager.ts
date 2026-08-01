import * as THREE from 'three';

export class InputManager {
  private isDragging = false;
  private startDragY = 0;
  private currentPower = 0;
  private gl: THREE.WebGLRenderer;
  private active = false;

  constructor(gl: THREE.WebGLRenderer) {
    this.gl = gl;
  }

  public activate(
    onPowerChange: (power: number) => void,
    onShotReady: (power: number) => void
  ) {
    if (this.active) return;
    this.active = true;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Only left click
      if (e.target !== this.gl.domElement) return;

      this.isDragging = true;
      this.startDragY = e.clientY;
      this.currentPower = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (this.isDragging) {
        const dragDist = e.clientY - this.startDragY;
        // 250px downward drag maps to 100% power
        const nextPower = Math.min(Math.max((dragDist / 250) * 100, 0), 100);
        if (nextPower !== this.currentPower) {
          this.currentPower = nextPower;
          onPowerChange(Math.round(nextPower));
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!this.isDragging) return;

      this.isDragging = false;
      const finalPower = Math.round(this.currentPower);
      if (finalPower >= 5) {
        onShotReady(finalPower);
      } else {
        this.currentPower = 0;
        onPowerChange(0);
      }
    };

    (this as any)._down = handlePointerDown;
    (this as any)._move = handlePointerMove;
    (this as any)._up = handlePointerUp;

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  public deactivate() {
    if (!this.active) return;
    this.active = false;
    this.isDragging = false;
    this.currentPower = 0;

    window.removeEventListener('pointerdown', (this as any)._down);
    window.removeEventListener('pointermove', (this as any)._move);
    window.removeEventListener('pointerup', (this as any)._up);
  }

  public getPower() {
    return this.currentPower;
  }

  public getIsDragging() {
    return this.isDragging;
  }

  /**
   * Projects camera ray onto the Y=0.28 table plane and calculates aiming angle
   */
  public static calculateAimAngle(
    raycaster: THREE.Raycaster,
    cueBallPos: THREE.Vector3
  ): number {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.28);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    const aimDir = new THREE.Vector3().subVectors(target, cueBallPos);
    aimDir.y = 0;
    aimDir.normalize();

    if (aimDir.lengthSq() > 0) {
      return Math.atan2(aimDir.x, aimDir.z) + Math.PI;
    }
    return 0;
  }
}

export default InputManager;
