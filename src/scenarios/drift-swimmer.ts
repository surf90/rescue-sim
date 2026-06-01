import type { Scenario } from '../scenario-types';

export const driftSwimmer: Scenario = {
  id: 'drift-swimmer',
  name: '離岸流で沖へ流された遊泳者',
  description: 'ヘッドランド東側の離岸流に乗り、沖へ流された遊泳者をチューブ・ボード・IRBで救助',
  phases: [
    { time: 0, label: '1. 溺者発見・通報' },
    { time: 2, label: '2. 一次出動（チューブ・ボード）' },
    { time: 4, label: '3. 二次出動（IRB）' },
    { time: 6.5, label: '4. 接触・確保' },
    { time: 9, label: '5. 搬送・帰投' },
    { time: 13, label: '6. 救助完了' },
  ],
  events: [
    { time: 0.5, asset: 'drone', target: [0, 12, -25] },
    { time: 2, asset: 'tube', target: [-2, 0.2, -5] },
    { time: 2.5, asset: 'board', target: [2, 0.15, -12] },
    { time: 4, asset: 'irb', target: [4, 0.5, -22] },
    { time: 6.5, asset: 'tube', target: [-1, 0.2, -23] },
    { time: 6.5, asset: 'board', target: [1, 0.15, -22] },
    { time: 9, asset: 'irb', target: [20, 0.5, 35] },
    { time: 9.5, asset: 'victim', target: [20, 0.4, 35] },
    { time: 10, asset: 'tube', target: [-6, 0.2, 33] },
    { time: 10, asset: 'board', target: [6, 0.15, 33] },
    { time: 10, asset: 'drone', target: [-30, 8, 40] },
  ],
};
