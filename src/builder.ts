import * as THREE from 'three';
import type { AssetKey, AssetMap } from './assets';
import type { Scenario, MoveEvent, PhaseEvent } from './scenario-types';

/**
 * シナリオ編集モード。
 * - アクティブ時、海面/砂浜タップで「選択中アセット」のウェイポイントを現在時刻に追加
 * - 追加されたイベントは Scenario.events に push される（呼び出し側で保存）
 */
export class ScenarioBuilder {
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private listener?: (ev: PointerEvent) => void;
  active = false;
  /** 配置先のアセット種別 */
  selectedAsset: AssetKey = 'tube';
  /** 配置されるイベントの time（UIから調整） */
  currentTime = 0;

  constructor(
    private dom: HTMLElement,
    private camera: THREE.Camera,
    /** 海面と砂浜のメッシュ（ピッキング対象） */
    private pickTargets: THREE.Object3D[],
    private assets: AssetMap,
  ) {}

  start(scenario: Scenario, onAdd: (ev: MoveEvent) => void) {
    this.stop();
    this.active = true;
    this.listener = (e) => {
      const rect = this.dom.getBoundingClientRect();
      this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hits = this.raycaster.intersectObjects(this.pickTargets, false);
      if (hits.length === 0) return;
      const p = hits[0].point;
      const y = this.assets[this.selectedAsset]?.position.y ?? 0.3;
      const move: MoveEvent = {
        time: this.currentTime,
        asset: this.selectedAsset,
        target: [p.x, y, p.z],
      };
      scenario.events.push(move);
      scenario.events.sort((a, b) => a.time - b.time);
      onAdd(move);
    };
    this.dom.addEventListener('pointerdown', this.listener);
    this.dom.style.cursor = 'crosshair';
  }

  stop() {
    if (this.listener) {
      this.dom.removeEventListener('pointerdown', this.listener);
      this.listener = undefined;
    }
    this.dom.style.cursor = '';
    this.active = false;
  }
}

export function removeEvent(scenario: Scenario, idx: number) {
  scenario.events.splice(idx, 1);
}

export function addPhase(scenario: Scenario, p: PhaseEvent) {
  scenario.phases.push(p);
  scenario.phases.sort((a, b) => a.time - b.time);
}

export function removePhase(scenario: Scenario, idx: number) {
  scenario.phases.splice(idx, 1);
}
