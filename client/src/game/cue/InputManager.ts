import * as THREE from 'three';

export class InputManager {
  private isDragging = false;
  private startDragX = 0;
  private startDragY = 0;
  private currentDragX = 0;
  private currentDragY = 0;
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

      if (e.button === 0) {
        // Left click starts dragging for power
        this.isDragging = true;
        this.startDragX = e.clientX;
        this.startDragY = e.clientY;
        this.currentDragX = e.clientX;
        this.currentDragY = e.clientY;
        this.currentPower = 0;
        
        leftStartX = e.clientX;
        leftStartY = e.clientY;
        leftStartTime = performance.now();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (this.isDragging) {
        this.currentDragX = e.clientX;
        this.currentDragY = e.clientY;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 0) {
        const wasDragging = this.isDragging;
        this.isDragging = false;
        
        const elapsed = performance.now() - leftStartTime;
        const dist = Math.sqrt((e.clientX - leftStartX) ** 2 + (e.clientY - leftStartY) ** 2);
        
        if (wasDragging && dist >= 6) {
          // Dragged and released to shoot
          if (this.currentPower >= 5) {
            onStrike();
          } else {
            onPowerChange(0);
          }
        } else if (dist < 6 && elapsed < 350) {
          // Quick click to shoot
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

  public setCurrentPower(power: number) {
    this.currentPower = power;
  }

  public getIsDragging() {
    return this.isDragging;
  }

  public getStartDragPos() {
    return { x: this.startDragX, y: this.startDragY };
  }

  public getCurrentDragPos() {
    return { x: this.currentDragX, y: this.currentDragY };
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
