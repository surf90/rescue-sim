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
    spring: 0x3a8fb7,
    summer: 0x1d6fa5,
    autumn: 0x2a6f97,
    winter: 0x1f4f7a,
  }[state.season];
  (env.ocean.material as THREE.MeshStandardMaterial).color.setHex(seaColor);

  // 天候 → 背景・フォグ・光源（沖までフォグが届かないよう遠端を拡大）
  switch (state.weather) {
    case 'clear':
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.Fog(0x87ceeb, 200, 800);
      ambient.intensity = 0.7;
      sun.intensity = 1.0;
      sun.color.setHex(0xffffff);
      break;
    case 'cloudy':
      scene.background = new THREE.Color(0xb8c2cc);
      scene.fog = new THREE.Fog(0xb8c2cc, 180, 700);
      ambient.intensity = 0.6;
      sun.intensity = 0.5;
      sun.color.setHex(0xf3f4f6);
      break;
    case 'rainy':
      scene.background = new THREE.Color(0x6b7280);
      scene.fog = new THREE.Fog(0x6b7280, 120, 500);
      ambient.intensity = 0.45;
      sun.intensity = 0.3;
      sun.color.setHex(0xcbd5e1);
      break;
    case 'foggy':
      scene.background = new THREE.Color(0xd1d5db);
      scene.fog = new THREE.Fog(0xd1d5db, 80, 320);
      ambient.intensity = 0.55;
      sun.intensity = 0.4;
      break;
  }

  // 風 → 旗の向き（pole周りに回転）
  const [wx, wz] = windVector(state.windDir);
  const angle = Math.atan2(wx, wz); // 旗が風下を指す
  env.flag.rotation.y = angle;
  // 風速で旗の傾き（静的な傾きのみ。はためきアニメは行わない）
  env.flag.rotation.z = Math.min(state.windSpeed / 20, 0.5);
}
