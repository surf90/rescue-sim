import type { Scenario } from '../scenario-types';

export const injuredSurfer: Scenario = {
  id: 'injured-surfer',
  name: 'ヘッドランド付近で負傷したサーファー',
  description: 'T字堤防際でワイプアウトし負傷。PWCで急行し、IRBで搬送',
  phases: [
    { time: 0, label: '1. 通報・状況確認' },
    { time: 1.5, label: '2. PWC急行' },
    { time: 4, label: '3. IRB・ドローン展開' },
    { time: 7, label: '4. ピックアップ' },
    { time: 10, label: '5. 搬送' },
    { time: 13, label: '6. 引継ぎ完了' },
  ],
  events: [
    { time: 0.5, asset: 'drone', target: [10, 14, -60] },
    { time: 1.5, asset: 'pwc', target: [10, 0.5, -55] },
    { time: 4, asset: 'irb', target: [12, 0.5, -50] },
    { time: 4, asset: 'board', target: [8, 0.15, -20] },
    { time: 7, asset: 'pwc', target: [10, 0.5, -58] },
    { time: 7.5, asset: 'irb', target: [10, 0.5, -55] },
    { time: 10, asset: 'irb', target: [25, 0.5, 36] },
    { time: 10, asset: 'victim', target: [25, 0.4, 36] },
    { time: 10.5, asset: 'pwc', target: [30, 0.5, 36] },
    { time: 10.5, asset: 'board', target: [6, 0.15, 33] },
    { time: 10.5, asset: 'drone', target: [-30, 8, 40] },
  ],
};
