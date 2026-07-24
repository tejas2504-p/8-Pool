import React, { useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

interface TrailProps {
  targetRef: React.RefObject<RapierRigidBody | null>;
  color?: string;
  maxPoints?: number;
}

export const Trail: React.FC<TrailProps> = ({ targetRef, color = '#00f0ff', maxPoints = 20 }) => {
  // Track previous coordinates list
  const [points] = useState<THREE.Vector3[]>(() => {
    const list = [];
    for (let i = 0; i < maxPoints; i++) {
      list.push(new THREE.Vector3(0, -10, 0));
    }
    return list;
  });

  // Pre-instantiate the Three.js Line object to avoid SVG JSX conflicts
  const line = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const mat = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: 0.65
    });

    return new THREE.Line(geom, mat);
  }, [maxPoints, color]);

  useFrame(() => {
    if (!targetRef.current || !targetRef.current.isValid() || !line) return;

    try {
      const translation = targetRef.current.translation();
      const linvel = targetRef.current.linvel();
      const speed = Math.sqrt(linvel.x * linvel.x + linvel.z * linvel.z);

      // Scroll points array
      for (let i = 0; i < maxPoints - 1; i++) {
        points[i].copy(points[i + 1]);
      }

      const currentPoint = points[maxPoints - 1];
      if (speed > 0.05) {
        currentPoint.set(translation.x, 0.28, translation.z);
      } else {
        // Fade off trail by moving points out of boundary
        currentPoint.set(translation.x, -10, translation.z);
      }

      const positionAttribute = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (positionAttribute) {
        for (let i = 0; i < maxPoints; i++) {
          positionAttribute.setXYZ(i, points[i].x, points[i].y, points[i].z);
        }
        positionAttribute.needsUpdate = true;
      }
    } catch (e) {
      // Handle initial frames
    }
  });

  return <primitive object={line} />;
};

export default Trail;
