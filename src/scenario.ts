import * as THREE from 'three';
import type { AssetMap } from './assets';
import type { Scenario } from './scenario-types';
import { driftSwimmer } from './scenarios/drift-swimmer';
import { injuredSurfer } from './scenarios/injured-surfer';
import { supDrift } from './scenarios/sup-drift';

export const PRESET_SCENARIOS: Scenario[] = [driftSwimmer, injuredSurfer, supDrift];

/** 経過時間に応じて全アセットを目標位置へ補間 */
export function updateScenario(elapsed: number, assets: AssetMap, scenario: Scenario) {
  const tmp = new THREE.Vector3();
  for (const ev of scenario.events) {
    if (elapsed < ev.time) continue;
    const obj = assets[ev.asset];
    if (!obj) continue;
    tmp.set(...ev.target);
    obj.position.lerp(tmp, ev.lerp ?? 0.05);
  }
}

/** 現在のフェーズラベルを返す */
export function currentPhase(elapsed: number, scenario: Scenario): string {
  let label = scenario.phases[0]?.label ?? '';
  for (const p of scenario.phases) {
    if (elapsed >= p.time) label = p.label;
  }
  return label;
}

/** ID で検索 */
export function findScenario(list: Scenario[], id: string): Scenario | undefined {
  return list.find((s) => s.id === id);
}

/** 新規空シナリオの雛形 */
export function emptyScenario(name: string): Scenario {
  const id = `custom-${Date.now()}`;
  return {
    id,
    name,
    description: '',
    phases: [{ time: 0, label: '1. 開始' }],
    events: [],
    custom: true,
  };
}
