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
    onStrike: () => void
  ) {
    if (this.active) return;
    this.active = true;

    let leftStartX = 0;
    let leftStartY = 0;
    let leftStartTime = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.target !== this.gl.domElement) return;

      if (e.button === 2) {
        // Right click starts dragging for power
        this.isDragging = true;
        this.startDragY = e.clientY;
      } else if (e.button === 0) {
        // Left click down records starting positions for click detection
        leftStartX = e.clientX;
        leftStartY = e.clientY;
        leftStartTime = performance.now();
      }
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
      if (e.button === 2) {
        // Right click release stops dragging
        this.isDragging = false;
      } else if (e.button === 0) {
        // Left click up checks if it was a quick click to trigger the strike
        const elapsed = performance.now() - leftStartTime;
        const dist = Math.sqrt((e.clientX - leftStartX) ** 2 + (e.clientY - leftStartY) ** 2);
        if (dist < 6 && elapsed < 350) {
          onStrike();
        }
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
