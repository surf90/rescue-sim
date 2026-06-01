import * as THREE from 'three';
import type { AssetKey, AssetMap } from './assets';

/** タイムライン1イベント：指定時刻以降、対象アセットを目標位置へ補間移動 */
export interface MoveEvent {
  time: number;
  asset: AssetKey;
  target: [number, number, number];
  lerp?: number;
}

export interface PhaseEvent {
  time: number;
  label: string;
}

/** 救助連携シナリオ（初期版） */
export const scenario: MoveEvent[] = [
  // フェーズ1: 溺者発見 → ドローン急行
  { time: 0.5, asset: 'drone', target: [0, 12, -25] },
  // フェーズ2: 一次出動（チューブ・ボード）
  { time: 2.0, asset: 'tube', target: [-2, 0.2, -5] },
  { time: 2.5, asset: 'board', target: [2, 0.15, -12] },
  // フェーズ3: 二次出動（IRB・PWC）
  { time: 3.5, asset: 'irb', target: [4, 0.5, -22] },
  { time: 4.0, asset: 'pwc', target: [-4, 0.5, -23] },
  // フェーズ4: 集結
  { time: 6.0, asset: 'tube', target: [-1, 0.2, -23] },
  { time: 6.5, asset: 'board', target: [1, 0.15, -22] },
  // フェーズ5: 帰投
  { time: 10.0, asset: 'irb', target: [10, 0.5, 28] },
  { time: 10.5, asset: 'pwc', target: [-10, 0.5, 28] },
  { time: 11.0, asset: 'victim', target: [10, 0.4, 28] },
  { time: 11.0, asset: 'tube', target: [-3, 0.2, 28] },
  { time: 11.0, asset: 'board', target: [3, 0.15, 28] },
  { time: 11.0, asset: 'drone', target: [-15, 8, 30] },
];

export const phases: PhaseEvent[] = [
  { time: 0.0, label: '1. 溺者発見・通報' },
  { time: 2.0, label: '2. 一次出動（チューブ・ボード）' },
  { time: 3.5, label: '3. 二次出動（IRB・PWC）' },
  { time: 6.0, label: '4. 接触・集結' },
  { time: 10.0, label: '5. 搬送・帰投' },
  { time: 13.0, label: '6. 救助完了' },
];

/** 経過時間に応じて全アセットを目標位置へ補間 */
export function updateScenario(elapsed: number, assets: AssetMap) {
  const tmp = new THREE.Vector3();
  for (const ev of scenario) {
    if (elapsed < ev.time) continue;
    const obj = assets[ev.asset];
    tmp.set(...ev.target);
    obj.position.lerp(tmp, ev.lerp ?? 0.05);
  }
}

/** 現在のフェーズラベルを返す */
export function currentPhase(elapsed: number): string {
  let label = phases[0].label;
  for (const p of phases) {
    if (elapsed >= p.time) label = p.label;
  }
  return label;
}
