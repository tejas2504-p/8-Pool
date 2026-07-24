import React from 'react';
import * as THREE from 'three';

// 1. REUSE MATERIALS: Instantiated once at module scope
const feltMaterial = new THREE.MeshStandardMaterial({
  color: '#155843',
  roughness: 0.85,
  metalness: 0.15,
});

const pocketMaterial = new THREE.MeshStandardMaterial({
  color: '#020617',
  roughness: 0.9,
});

const woodMaterial = new THREE.MeshStandardMaterial({
  color: '#7c2d12',
  roughness: 0.4,
});

// 2. REUSE GEOMETRIES: Instantiated once at module scope
const feltBedGeometry = new THREE.BoxGeometry(10, 0.2, 5);
const cornerPocketGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.01, 24);
const middlePocketGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.01, 24);
const horizontalRailGeometry = new THREE.BoxGeometry(10.8, 0.4, 0.4);
const verticalRailGeometry = new THREE.BoxGeometry(0.4, 0.4, 5.8);
const tableLegGeometry = new THREE.BoxGeometry(0.5, 3.0, 0.5);

export const PoolTable: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Green Felt Bed */}
      <mesh 
        receiveShadow 
        position={[0, 0, 0]}
        geometry={feltBedGeometry}
        material={feltMaterial}
        frustumCulled={true}
      />

      {/* Pockets */}
      {/* Top-Left Corner */}
      <mesh 
        position={[-4.8, 0.11, -2.3]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Top-Right Corner */}
      <mesh 
        position={[4.8, 0.11, -2.3]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Left Corner */}
      <mesh 
        position={[-4.8, 0.11, 2.3]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Right Corner */}
      <mesh 
        position={[4.8, 0.11, 2.3]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Top-Middle */}
      <mesh 
        position={[0, 0.11, -2.4]}
        geometry={middlePocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Middle */}
      <mesh 
        position={[0, 0.11, 2.4]}
        geometry={middlePocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />

      {/* Wooden Rails (borders) */}
      {/* Top Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, 0.2, -2.7]}
        geometry={horizontalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Bottom Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, 0.2, 2.7]}
        geometry={horizontalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Left Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[-5.2, 0.2, 0]}
        geometry={verticalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Right Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[5.2, 0.2, 0]}
        geometry={verticalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />

      {/* Table Legs (extending down to Y=-3) */}
      {/* Top-Left Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[-4.8, -1.5, -2.3]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Top-Right Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[4.8, -1.5, -2.3]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Left Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[-4.8, -1.5, 2.3]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Right Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[4.8, -1.5, 2.3]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
    </group>
  );
};

export default PoolTable;
