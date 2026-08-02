import React, { forwardRef } from 'react';
import * as THREE from 'three';

export const AimLine = forwardRef<THREE.Group>((_, ref) => {
  return (
    <group ref={ref} visible={false}>
      {/* 1. Primary Aim Line (Dashed/Solid look with a dark border) */}
      <group name="primaryLine">
        {/* Dark outline */}
        <mesh position={[0, -0.001, 0]} renderOrder={10}>
          <boxGeometry args={[0.036, 0.001, 1.002]} />
          <meshBasicMaterial color="#111111" transparent={true} opacity={0.9} depthWrite={false} />
        </mesh>
        {/* White core */}
        <mesh position={[0, 0, 0]} renderOrder={11}>
          <boxGeometry args={[0.018, 0.0011, 1]} />
          <meshBasicMaterial color="#ffffff" transparent={true} opacity={1.0} depthWrite={false} />
        </mesh>
      </group>

      {/* 2. Ghost Ball representation at contact point - A clean flat horizontal ring with dark outline */}
      <group name="ghostBall" rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer Dark Ring */}
        <mesh position={[0, 0, -0.001]} renderOrder={12}>
          <ringGeometry args={[0.162, 0.19, 64]} />
          <meshBasicMaterial color="#111111" transparent={true} opacity={0.95} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {/* Inner White Ring */}
        <mesh position={[0, 0, 0]} renderOrder={13}>
          <ringGeometry args={[0.172, 0.18, 64]} />
          <meshBasicMaterial color="#ffffff" transparent={true} opacity={1.0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>

      {/* 3. Target Ball Path line (With a dark outline) */}
      <group name="targetLine">
        {/* Dark outline */}
        <mesh position={[0, -0.001, 0]} renderOrder={10}>
          <boxGeometry args={[0.03, 0.001, 1.002]} />
          <meshBasicMaterial color="#111111" transparent={true} opacity={0.9} depthWrite={false} />
        </mesh>
        {/* White core */}
        <mesh position={[0, 0, 0]} renderOrder={11}>
          <boxGeometry args={[0.015, 0.0011, 1]} />
          <meshBasicMaterial color="#ffffff" transparent={true} opacity={1.0} depthWrite={false} />
        </mesh>
      </group>

      {/* 4. Cue Ball Deflection line (With a dark outline, slightly dimmer/thinner) */}
      <group name="deflectionLine">
        {/* Dark outline */}
        <mesh position={[0, -0.001, 0]} renderOrder={10}>
          <boxGeometry args={[0.024, 0.001, 1.002]} />
          <meshBasicMaterial color="#111111" transparent={true} opacity={0.6} depthWrite={false} />
        </mesh>
        {/* White core */}
        <mesh position={[0, 0, 0]} renderOrder={11}>
          <boxGeometry args={[0.012, 0.0011, 1]} />
          <meshBasicMaterial color="#ffffff" transparent={true} opacity={0.7} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
});

AimLine.displayName = 'AimLine';
export default AimLine;
