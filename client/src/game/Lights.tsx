import React from 'react';
import useSettingsStore from '../store/useSettingsStore';

export const Lights: React.FC = () => {
  const shadowQuality = useSettingsStore((state) => state.settings.shadowQuality);

  const castShadows = shadowQuality !== 'low';
  const shadowMapSize = shadowQuality === 'high' ? 2048 : 1024;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow={castShadows}
        position={[4, 12, 4]}
        intensity={1.5}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-far={40}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[-8, 8, -8]} intensity={0.4} />
    </>
  );
};

export default Lights;
