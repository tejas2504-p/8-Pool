import React from 'react';
import * as THREE from 'three';

// 1. Felt texture generator
const createFeltTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Rich camel-brown felt
  ctx.fillStyle = '#8f6c4b';
  ctx.fillRect(0, 0, 1024, 512);

  // Add fine felt texture noise
  const imgData = ctx.getImageData(0, 0, 1024, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 6;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw table markings
  // Baulk line (head string) at X = -2.5 -> U = 0.25 -> 256px
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // Head spot at (256, 256)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(256, 256, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(256, 256, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Foot spot (rack center apex) at X = 1.5 -> U = 0.65 -> 665.6px
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(665, 256, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(665, 256, 1.5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// 2. Wood texture generator
const createWoodTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Rich walnut brown base
  ctx.fillStyle = '#3d2314';
  ctx.fillRect(0, 0, 512, 128);

  // Dark brown wood grain lines
  for (let i = 0; i < 45; i++) {
    ctx.strokeStyle = `rgba(28, 12, 4, ${Math.random() * 0.25 + 0.15})`;
    ctx.lineWidth = Math.random() * 3 + 1;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }

  // Subtle warm highlights in grain
  for (let i = 0; i < 15; i++) {
    ctx.strokeStyle = `rgba(100, 70, 45, ${Math.random() * 0.08})`;
    ctx.lineWidth = Math.random() * 6 + 1.5;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y + (Math.random() - 0.5) * 10);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// Reused Materials
const feltMaterial = new THREE.MeshStandardMaterial({
  map: createFeltTexture(),
  roughness: 0.85,
  metalness: 0.0,
});

const pocketMaterial = new THREE.MeshStandardMaterial({
  color: '#090d16', // Deep, dark pocket hole
  roughness: 0.95,
  metalness: 0.0,
});

const woodMaterial = new THREE.MeshStandardMaterial({
  map: createWoodTexture(),
  roughness: 0.22, // Nice polished wood reflection
  metalness: 0.05,
});

const chromeMaterial = new THREE.MeshStandardMaterial({
  color: '#cbd5e1', // Bright silver metallic trim
  roughness: 0.08,
  metalness: 0.95,
  side: THREE.DoubleSide,
});

// Reused Geometries
const feltBedGeometry = new THREE.BoxGeometry(12, 0.2, 6);
const cornerPocketGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.1, 24);
const middlePocketGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 24);

const horizontalRailGeometry = new THREE.BoxGeometry(12.96, 0.4, 0.4);
const verticalRailGeometry = new THREE.BoxGeometry(0.4, 0.4, 6.8);
const tableLegGeometry = new THREE.BoxGeometry(0.5, 3.0, 0.5);

// New Rims & Cushion Geometries
const cornerRimGeometry = new THREE.RingGeometry(0.25, 0.29, 32);
const middleRimGeometry = new THREE.RingGeometry(0.23, 0.27, 32);

const horizontalCushionGeometry = new THREE.BoxGeometry(4.92, 0.2, 0.04);
const verticalCushionGeometry = new THREE.BoxGeometry(0.04, 0.2, 4.6);

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

      {/* Sunken Pockets (Y=0.08 for realistic pocket drop) */}
      {/* Top-Left Corner */}
      <mesh 
        position={[-5.76, 0.08, -2.76]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Top-Right Corner */}
      <mesh 
        position={[5.76, 0.08, -2.76]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Left Corner */}
      <mesh 
        position={[-5.76, 0.08, 2.76]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Right Corner */}
      <mesh 
        position={[5.76, 0.08, 2.76]}
        geometry={cornerPocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Top-Middle */}
      <mesh 
        position={[0, 0.08, -2.88]}
        geometry={middlePocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Middle */}
      <mesh 
        position={[0, 0.08, 2.88]}
        geometry={middlePocketGeometry}
        material={pocketMaterial}
        frustumCulled={true}
      />

      {/* Chrome Pocket Rims / Plates */}
      <mesh 
        position={[-5.76, 0.201, -2.76]} 
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={cornerRimGeometry}
        material={chromeMaterial}
      />
      <mesh 
        position={[5.76, 0.201, -2.76]} 
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={cornerRimGeometry}
        material={chromeMaterial}
      />
      <mesh 
        position={[-5.76, 0.201, 2.76]} 
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={cornerRimGeometry}
        material={chromeMaterial}
      />
      <mesh 
        position={[5.76, 0.201, 2.76]} 
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={cornerRimGeometry}
        material={chromeMaterial}
      />
      <mesh 
        position={[0, 0.201, -2.88]} 
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={middleRimGeometry}
        material={chromeMaterial}
      />
      <mesh 
        position={[0, 0.201, 2.88]} 
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={middleRimGeometry}
        material={chromeMaterial}
      />

      {/* Wooden Rails (borders) */}
      {/* Top Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, 0.2, -3.2]}
        geometry={horizontalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Bottom Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, 0.2, 3.2]}
        geometry={horizontalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Left Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[-6.2, 0.2, 0]}
        geometry={verticalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Right Rail */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[6.2, 0.2, 0]}
        geometry={verticalRailGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />

      {/* Inner Felt Cushions (segments that face the inside of the table) */}
      {/* Top-Left Cushion */}
      <mesh 
        receiveShadow 
        position={[-2.88, 0.2, -3.02]}
        geometry={horizontalCushionGeometry}
        material={feltMaterial}
        frustumCulled={true}
      />
      {/* Top-Right Cushion */}
      <mesh 
        receiveShadow 
        position={[2.88, 0.2, -3.02]}
        geometry={horizontalCushionGeometry}
        material={feltMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Left Cushion */}
      <mesh 
        receiveShadow 
        position={[-2.88, 0.2, 3.02]}
        geometry={horizontalCushionGeometry}
        material={feltMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Right Cushion */}
      <mesh 
        receiveShadow 
        position={[2.88, 0.2, 3.02]}
        geometry={horizontalCushionGeometry}
        material={feltMaterial}
        frustumCulled={true}
      />
      {/* Left Cushion */}
      <mesh 
        receiveShadow 
        position={[-6.02, 0.2, 0]}
        geometry={verticalCushionGeometry}
        material={feltMaterial}
        frustumCulled={true}
      />
      {/* Right Cushion */}
      <mesh 
        receiveShadow 
        position={[6.02, 0.2, 0]}
        geometry={verticalCushionGeometry}
        material={feltMaterial}
        frustumCulled={true}
      />

      {/* Table Legs (extending down to Y=-3) */}
      {/* Top-Left Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[-5.76, -1.5, -2.76]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Top-Right Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[5.76, -1.5, -2.76]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Left Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[-5.76, -1.5, 2.76]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
      {/* Bottom-Right Leg */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[5.76, -1.5, 2.76]}
        geometry={tableLegGeometry}
        material={woodMaterial}
        frustumCulled={true}
      />
    </group>
  );
};

export default PoolTable;
