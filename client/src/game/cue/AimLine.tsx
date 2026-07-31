import React, { forwardRef } from 'react';
import * as THREE from 'three';

export const AimLine = forwardRef<THREE.Group>((_, ref) => {
  return (
    <group ref={ref} visible={false}>
      {/* 1. Primary Aim Line (Thin solid white line) */}
      <mesh name="primaryLine">
        <boxGeometry args={[0.012, 0.001, 1]} />
        <meshBasicMaterial color="#ffffff" transparent={true} opacity={0.8} />
      </mesh>

      {/* 2. Ghost Ball representation at contact point - A clean flat horizontal ring */}
      <mesh name="ghostBall" rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.172, 0.18, 64]} />
        <meshBasicMaterial color="#ffffff" transparent={true} opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* 3. Target Ball Path line (Thin solid white line) */}
      <mesh name="targetLine">
        <boxGeometry args={[0.01, 0.001, 1]} />
        <meshBasicMaterial color="#ffffff" transparent={true} opacity={0.8} />
      </mesh>

      {/* 4. Cue Ball Deflection line (Thin solid white line, slightly dimmer) */}
      <mesh name="deflectionLine">
        <boxGeometry args={[0.01, 0.001, 1]} />
        <meshBasicMaterial color="#ffffff" transparent={true} opacity={0.4} />
      </mesh>
    </group>
  );
});

AimLine.displayName = 'AimLine';
export default AimLine;
