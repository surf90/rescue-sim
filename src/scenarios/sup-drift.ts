import type { Scenario } from '../scenario-types';

export const supDrift: Scenario = {
  id: 'sup-drift',
  name: 'SUP漂流（北風で沖に流される）',
  description: '北風で沖へ流されるSUP。ドローンで位置特定後、PWCで救援、IRBで搬送',
  phases: [
    { time: 0, label: '1. 漂流通報' },
    { time: 2, label: '2. ドローン索敵' },
    { time: 4.5, label: '3. PWC急行' },
    { time: 8, label: '4. 確保・牽引' },
    { time: 11, label: '5. 帰投' },
    { time: 14, label: '6. 完了' },
  ],
  events: [
    { time: 0.5, asset: 'drone', target: [-20, 16, -80] },
    { time: 2, asset: 'drone', target: [-15, 14, -100] },
    { time: 4.5, asset: 'pwc', target: [-10, 0.5, -90] },
    { time: 5, asset: 'irb', target: [-5, 0.5, -50] },
    { time: 8, asset: 'pwc', target: [-15, 0.5, -100] },
    { time: 8.5, asset: 'victim', target: [-13, 0.4, -98] },
    { time: 11, asset: 'pwc', target: [-25, 0.5, 36] },
    { time: 11, asset: 'irb', target: [-15, 0.5, 36] },
    { time: 11, asset: 'victim', target: [-25, 0.4, 36] },
    { time: 11, asset: 'drone', target: [-30, 8, 40] },
  ],
};
