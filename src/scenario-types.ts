import type { AssetKey } from './assets';

/** 1つの移動イベント：time秒以降、対象アセットをtargetへ補間 */
export interface MoveEvent {
  time: number;
  asset: AssetKey;
  target: [number, number, number];
  /** 補間係数（毎フレーム）。未指定は 0.05 */
  lerp?: number;
}

/** フェーズ表示の切替点 */
export interface PhaseEvent {
  time: number;
  label: string;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  events: MoveEvent[];
  phases: PhaseEvent[];
  /** ユーザー保存シナリオの場合 true */
  custom?: boolean;
}
