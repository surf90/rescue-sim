/** 環境設定（季節・天候・風）と要救助者設定をまとめた中央状態 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'clear' | 'cloudy' | 'rainy' | 'foggy';
/** 8方位（風が「吹いてくる」方向） */
export type WindDir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export type VictimType = 'swimmer' | 'surfer' | 'sup';

export interface EnvState {
  season: Season;
  weather: Weather;
  windDir: WindDir;
  /** 風速 m/s */
  windSpeed: number;
  victim: {
    type: VictimType;
    /** 初期位置（ワールド座標 x, z） */
    position: [number, number];
  };
  /** 現在選択中のシナリオID */
  scenarioId: string;
  /** 再生速度倍率 */
  playbackRate: number;
}

export const DEFAULT_ENV: EnvState = {
  season: 'summer',
  weather: 'clear',
  windDir: 'S',
  windSpeed: 4,
  victim: {
    type: 'swimmer',
    position: [10, -40],
  },
  scenarioId: 'drift-swimmer',
  playbackRate: 1,
};

export const SEASON_LABEL: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

export const WEATHER_LABEL: Record<Weather, string> = {
  clear: '晴',
  cloudy: '曇',
  rainy: '雨',
  foggy: '霧',
};

export const WIND_LABEL: Record<WindDir, string> = {
  N: '北',
  NE: '北東',
  E: '東',
  SE: '南東',
  S: '南',
  SW: '南西',
  W: '西',
  NW: '北西',
};

export const VICTIM_LABEL: Record<VictimType, string> = {
  swimmer: '遊泳者',
  surfer: 'サーファー',
  sup: 'SUP',
};

/** 風が「吹いてくる」方向から「進む」方向の単位ベクトルを返す（X=東, Z=南） */
export function windVector(dir: WindDir): [number, number] {
  // dir は風の発生源方向。風の進行方向は逆向き。
  const map: Record<WindDir, [number, number]> = {
    N: [0, 1],
    NE: [-1, 1],
    E: [-1, 0],
    SE: [-1, -1],
    S: [0, -1],
    SW: [1, -1],
    W: [1, 0],
    NW: [1, 1],
  };
  const v = map[dir];
  const len = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / len, v[1] / len];
}
