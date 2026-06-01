/**
 * 茅ヶ崎ヘッドランドビーチの座標系・地形定数。
 * ワールド座標は 1単位 = 1m として扱う。
 * 海岸線はほぼ東西（X軸が東西、+X が東）。+Z が南（沖向き）。
 */

export const LOCATION = {
  name: '茅ヶ崎ヘッドランドビーチ',
  lat: 35.31688136235833,
  lon: 139.41600547700486,
  /** 磁北からの海岸線方位（参考値、北を0°として時計回り） */
  shorelineBearingDeg: 90,
} as const;

/** 砂浜帯：東西に長い矩形。中心 (0, 0, 砂浜の中央Z) */
export const BEACH = {
  width: 600, // 東西
  depth: 60, // 南北
  centerZ: 30, // +Z 寄りが内陸
} as const;

/** 海面（描画用）：砂浜の南側に広がる */
export const OCEAN = {
  width: 800,
  depth: 400,
  centerZ: -170,
} as const;

/** ヘッドランド堤防：基部突堤＋T字ヘッド（画像比率を参考に概算） */
export const HEADLAND = {
  /** 突堤（陸→沖方向） */
  stem: {
    width: 14, // 東西方向の幅
    length: 120, // 南北方向の長さ
    height: 1.2,
    /** 突堤の北端（陸側起点） */
    rootZ: -5,
  },
  /** T字ヘッド（東西に張り出す部分） */
  head: {
    width: 90, // 東西方向
    depth: 30, // 南北方向
    height: 1.5,
  },
} as const;

/** 国道134号（参考表示・砂浜の北縁） */
export const ROAD = {
  width: 600,
  depth: 4,
  centerZ: 58,
} as const;

/** 駐車場/プロムナード（砂浜と道路の間の薄帯） */
export const PROMENADE = {
  width: 600,
  depth: 6,
  centerZ: 53,
} as const;
