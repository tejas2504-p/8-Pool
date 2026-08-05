import React from 'react';
import useSettingsStore from '../store/useSettingsStore';

export const Lights: React.FC = () => {
  const shadowQuality = useSettingsStore((state) => state.settings.shadowQuality);

  const castShadows = shadowQuality !== 'low';
  const shadowMapSize = shadowQuality === 'high' ? 2048 : 1024;

  return (
    <>
      {/* Dim room ambiance to make the table pop */}
      <ambientLight intensity={0.35} />

      {/* Main overhead downward light representing the tournament table light fixture */}
      <directionalLight
        castShadow={castShadows}
        position={[0, 8, 0]}
        intensity={2.2}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-camera-far={15}
        shadow-camera-left={-7.5}
        shadow-camera-right={7.5}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />

      {/* Soft color-bounced fill point lights from sides */}
      <pointLight position={[-4, 5, -2]} intensity={0.4} color="#e0f2fe" />
      <pointLight position={[4, 5, 2]} intensity={0.4} color="#ffedd5" />
    </>
  );
};

export default Lights;
