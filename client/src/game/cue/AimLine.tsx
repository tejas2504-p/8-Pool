import React, { forwardRef } from 'react';
import * as THREE from 'three';

const DashShaderMaterial = ({ color, initialDashScale = 20.0 }: { color: string; initialDashScale?: number }) => {
  return (
    <shaderMaterial
      attach="material"
      transparent={true}
      uniforms={{
        color: { value: new THREE.Color(color) },
        dashScale: { value: initialDashScale },
      }}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        uniform vec3 color;
        uniform float dashScale;
        void main() {
          // Dash pattern: 55% solid, 45% gap
          float dash = step(0.45, fract(vUv.y * dashScale));
          if (dash < 0.5) discard;
          gl_FragColor = vec4(color, 1.0);
        }
      `}
    />
  );
};

export const AimLine = forwardRef<THREE.Group>((_, ref) => {
  return (
    <group ref={ref} visible={false}>
      {/* 1. Primary Aim Line (Dotted box) */}
      <mesh name="primaryLine">
        <boxGeometry args={[0.024, 0.001, 1]} />
        <DashShaderMaterial color="#00f0ff" initialDashScale={20.0} />
      </mesh>

      {/* 2. Ghost Ball representation at contact point */}
      <mesh name="ghostBall">
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} wireframe />
      </mesh>

      {/* 3. Target Ball Path line */}
      <mesh name="targetLine">
        <boxGeometry args={[0.018, 0.001, 1]} />
        <DashShaderMaterial color="#bd00ff" initialDashScale={30.0} />
      </mesh>

      {/* 4. Cue Ball Deflection line */}
      <mesh name="deflectionLine">
        <boxGeometry args={[0.018, 0.001, 1]} />
        <DashShaderMaterial color="#00f0ff" initialDashScale={30.0} />
      </mesh>
    </group>
  );
});

AimLine.displayName = 'AimLine';
export default AimLine;
