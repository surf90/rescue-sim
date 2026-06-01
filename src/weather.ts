import * as THREE from 'three';
import type { EnvState } from './environment-state';
import { windVector } from './environment-state';
import type { EnvironmentRefs } from './environment';

interface WeatherRefs {
  scene: THREE.Scene;
  ambient: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  env: EnvironmentRefs;
}

/** シーン作成直後に1回呼んで参照を集めておく */
export function collectWeatherRefs(
  scene: THREE.Scene,
  env: EnvironmentRefs,
): WeatherRefs {
  const ambient = scene.children.find(
    (c) => c instanceof THREE.AmbientLight,
  ) as THREE.AmbientLight;
  const sun = scene.children.find(
    (c) => c instanceof THREE.DirectionalLight,
  ) as THREE.DirectionalLight;
  return { scene, ambient, sun, env };
}

/**
 * EnvState の変更を描画へ反映（背景・フォグ・光源・海面色・旗向き）。
 * 雨パーティクル等のアニメーションは扱わない（静的な雰囲気変化のみ）。
 */
export function applyEnv(refs: WeatherRefs, state: EnvState) {
  const { scene, ambient, sun, env } = refs;

  // 季節 → 海面色
  const seaColor = {
    spring: 0x5fc8de,
    summer: 0x3fb6d4,
    autumn: 0x4aa3c2,
    winter: 0x6aa9c4,
  }[state.season];
  (env.ocean.material as THREE.MeshStandardMaterial).color.setHex(seaColor);

  // 天候 → 背景・フォグ・光源（沖までフォグが届かないよう遠端を拡大）
  switch (state.weather) {
    case 'clear':
      scene.background = new THREE.Color(0xbfe7ff);
      scene.fog = new THREE.Fog(0xbfe7ff, 260, 1000);
      ambient.intensity = 0.5;
      sun.intensity = 1.1;
      sun.color.setHex(0xfff6e0);
      break;
    case 'cloudy':
      scene.background = new THREE.Color(0xdfe7ee);
      scene.fog = new THREE.Fog(0xdfe7ee, 220, 850);
      ambient.intensity = 0.55;
      sun.intensity = 0.65;
      sun.color.setHex(0xfdfaf2);
      break;
    case 'rainy':
      scene.background = new THREE.Color(0xa9b4be);
      scene.fog = new THREE.Fog(0xa9b4be, 160, 600);
      ambient.intensity = 0.5;
      sun.intensity = 0.4;
      sun.color.setHex(0xdce5ef);
      break;
    case 'foggy':
      scene.background = new THREE.Color(0xe7edf2);
      scene.fog = new THREE.Fog(0xe7edf2, 100, 420);
      ambient.intensity = 0.6;
      sun.intensity = 0.5;
      sun.color.setHex(0xffffff);
      break;
  }

  // 風 → 旗の向き（pole周りに回転）
  const [wx, wz] = windVector(state.windDir);
  const angle = Math.atan2(wx, wz); // 旗が風下を指す
  env.flag.rotation.y = angle;
  // 風速で旗の傾き（静的な傾きのみ。はためきアニメは行わない）
  env.flag.rotation.z = Math.min(state.windSpeed / 20, 0.5);
}
