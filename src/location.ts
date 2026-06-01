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

/** 海面（描画用）：砂浜の南側に大きく広がる（救助は防波堤の更に沖でも展開） */
export const OCEAN = {
  width: 1400,
  depth: 900,
  centerZ: -380,
} as const;

/** ヘッドランド堤防：基部突堤＋T字ヘッド（マップ実測ベース） */
export const HEADLAND = {
  /** 突堤（陸→沖方向） */
  stem: {
    width: 14, // 東西方向の幅
    length: 200, // マップ実測 200m
    height: 1.2,
    /** 突堤の北端（陸側起点） 砂浜の海側エッジ z=0 と地続き */
    rootZ: 0,
  },
  /** T字ヘッド（東西に張り出す部分） */
  head: {
    width: 180, // 東西張り出し（マップ斜めスパン 379m から推定）
    depth: 80, // 南北方向
    height: 1.5,
    /** 先端の丸み（半円弧の半径目安） */
    tipRadius: 30,
  },
  /** 突堤の付け根テーパー量（陸側で東西方向に広がる幅） */
  rootTaper: 8,
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
