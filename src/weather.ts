import * as THREE from 'three';
import type { EnvState } from './environment-state';
import { windVector } from './environment-state';
import type { EnvironmentRefs } from './environment';

interface WeatherRefs {
  scene: THREE.Scene;
  ambient: THREE.AmbientLight;
  sun: THREE.DirectionalLight;
  env: EnvironmentRefs;
  rain?: THREE.Points;
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

/** EnvState の変更を描画へ反映（背景・フォグ・光源・海面色・旗向き） */
export function applyEnv(refs: WeatherRefs, state: EnvState) {
  const { scene, ambient, sun, env } = refs;

  // 季節 → 海面色・砂浜の温度感
  const seaColor = {
    spring: 0x3a8fb7,
    summer: 0x1d6fa5,
    autumn: 0x2a6f97,
    winter: 0x1f4f7a,
  }[state.season];
  (env.ocean.material as THREE.MeshStandardMaterial).color.setHex(seaColor);

  // 天候 → 背景・フォグ・光源
  switch (state.weather) {
    case 'clear':
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.Fog(0x87ceeb, 120, 320);
      ambient.intensity = 0.7;
      sun.intensity = 1.0;
      sun.color.setHex(0xffffff);
      break;
    case 'cloudy':
      scene.background = new THREE.Color(0xb8c2cc);
      scene.fog = new THREE.Fog(0xb8c2cc, 100, 280);
      ambient.intensity = 0.6;
      sun.intensity = 0.5;
      sun.color.setHex(0xf3f4f6);
      break;
    case 'rainy':
      scene.background = new THREE.Color(0x6b7280);
      scene.fog = new THREE.Fog(0x6b7280, 60, 200);
      ambient.intensity = 0.45;
      sun.intensity = 0.3;
      sun.color.setHex(0xcbd5e1);
      break;
    case 'foggy':
      scene.background = new THREE.Color(0xd1d5db);
      scene.fog = new THREE.Fog(0xd1d5db, 30, 120);
      ambient.intensity = 0.55;
      sun.intensity = 0.4;
      break;
  }

  // 雨パーティクル
  toggleRain(refs, state.weather === 'rainy');

  // 風 → 旗の向き（pole周りに回転）
  const [wx, wz] = windVector(state.windDir);
  const angle = Math.atan2(wx, wz); // 旗が風下を指す
  env.flag.rotation.y = angle;
  // 風速で旗の傾き（はためき表現の簡易版）
  env.flag.rotation.z = Math.min(state.windSpeed / 20, 0.5);
}

function toggleRain(refs: WeatherRefs, enable: boolean) {
  if (enable && !refs.rain) {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400 - 50;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaab8c8,
      size: 0.3,
      transparent: true,
      opacity: 0.7,
    });
    refs.rain = new THREE.Points(geom, mat);
    refs.scene.add(refs.rain);
  } else if (!enable && refs.rain) {
    refs.scene.remove(refs.rain);
    refs.rain.geometry.dispose();
    (refs.rain.material as THREE.Material).dispose();
    refs.rain = undefined;
  }
}

/** 毎フレーム呼び出し：雨の落下アニメーション */
export function tickWeather(refs: WeatherRefs, dt: number) {
  if (!refs.rain) return;
  const pos = refs.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i) - dt * 40;
    if (y < 0) y = 80;
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
}
