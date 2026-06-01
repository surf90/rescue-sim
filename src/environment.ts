import * as THREE from 'three';
import { BEACH, OCEAN, HEADLAND, ROAD, PROMENADE } from './location';

/**
 * 茅ヶ崎ヘッドランドビーチの抽象ローポリ地形を構築。
 * 戻り値の ocean は天候/風の海面色更新と Raycaster ピッキングに使う。
 */
export interface EnvironmentRefs {
  ocean: THREE.Mesh;
  flag: THREE.Mesh;
  flagPole: THREE.Mesh;
}

/**
 * 海岸線エッジ点列（ワールド座標で返す）。
 * 突堤付け根（X が ±clampHalf 内）では揺らぎを 0 にクランプし、堤防側面と地続きにする。
 */
/**
 * 海岸線エッジ点列。低周波の合成正弦＋CatmullRom 補間で滑らかな曲線を得る。
 * 突堤付け根（|x| < clampHalf）では揺らぎ 0 にして地続き接続。
 */
function shorelinePoints(
  worldZ: number,
  amplitude: number,
  segments: number,
  phase: number,
  clampHalf: number,
): THREE.Vector2[] {
  const halfW = BEACH.width / 2;
  // 制御点（低密度・低周波）
  const ctrlCount = 10;
  const ctrl: THREE.Vector3[] = [];
  for (let i = 0; i <= ctrlCount; i++) {
    const t = i / ctrlCount;
    const x = -halfW + t * BEACH.width;
    const wobble =
      Math.sin(t * Math.PI * 1.6 + phase) * amplitude * 0.7 +
      Math.sin(t * Math.PI * 2.8 + phase * 1.3) * amplitude * 0.3;
    ctrl.push(new THREE.Vector3(x, worldZ + wobble, 0));
  }
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
  const sampled = curve.getPoints(segments);
  // 付け根クランプ：実際の砂浜エッジ z へ強制
  return sampled.map((p) => {
    const z = Math.abs(p.x) < clampHalf ? worldZ : p.y;
    return new THREE.Vector2(p.x, z);
  });
}

/**
 * ワールド XZ 平面（床面）に水平に張る Shape メッシュを作る。
 * Shape は xy 平面で組み、引数の点列は (x = ワールドX, y = ワールドZ) として渡す。
 * 内部で y → -y に反転してから ShapeGeometry に渡し、rotation.x = -PI/2 で
 * ワールド +Z 方向に正しくマップされるようにする（scale 反転を使わず法線維持）。
 */
function makeFlatShape(
  outline: THREE.Vector2[],
  color: number,
  y: number,
): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(outline[0].x, -outline[0].y);
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i].x, -outline[i].y);
  }
  shape.closePath();
  const geom = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

export function buildEnvironment(scene: THREE.Scene): EnvironmentRefs {
  // 海面（拡張された大きな矩形）
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(OCEAN.width, OCEAN.depth),
    new THREE.MeshStandardMaterial({ color: 0x3fb6d4, roughness: 0.7, metalness: 0.15 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.02, OCEAN.centerZ);
  ocean.name = 'ocean';
  scene.add(ocean);

  // 突堤付け根のクランプ範囲（砂浜と地続きにする）
  const stemHalf = HEADLAND.stem.width / 2;
  const taper = HEADLAND.rootTaper;
  const clampHalf = stemHalf + taper + 1;

  // 砂浜の海側/内陸側エッジ
  const seaEdgeZ = BEACH.centerZ - BEACH.depth / 2; // 海側 z=0
  const landEdgeZ = BEACH.centerZ + BEACH.depth / 2; // 内陸側 z=60
  const seaEdge = shorelinePoints(seaEdgeZ, 3.5, 96, 0.7, clampHalf);
  const landEdge = shorelinePoints(landEdgeZ, 1.2, 80, 2.1, 0);

  // 砂浜 Shape: 海側 → 内陸側（逆順で閉じる）
  const beachOutline: THREE.Vector2[] = [];
  beachOutline.push(...seaEdge);
  for (let i = landEdge.length - 1; i >= 0; i--) beachOutline.push(landEdge[i]);
  scene.add(makeFlatShape(beachOutline, 0xf6e3b0, 0));

  // 波打ち際（海側エッジの内側 2.5m の帯。付け根区間ではゼロ幅）
  const surfInner = seaEdge.map((p) => {
    const inset = Math.abs(p.x) < clampHalf ? 0 : 4;
    return new THREE.Vector2(p.x, p.y + inset);
  });
  const surfOutline: THREE.Vector2[] = [];
  surfOutline.push(...seaEdge);
  for (let i = surfInner.length - 1; i >= 0; i--) surfOutline.push(surfInner[i]);
  scene.add(makeFlatShape(surfOutline, 0xf2faff, 0.01));

  // プロムナード（駐車場帯）
  const promenade = new THREE.Mesh(
    new THREE.PlaneGeometry(PROMENADE.width, PROMENADE.depth),
    new THREE.MeshStandardMaterial({ color: 0xdfe3ea }),
  );
  promenade.rotation.x = -Math.PI / 2;
  promenade.position.set(0, 0.02, PROMENADE.centerZ);
  scene.add(promenade);

  // 国道134号
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD.width, ROAD.depth),
    new THREE.MeshStandardMaterial({ color: 0x7a8493 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.03, ROAD.centerZ);
  scene.add(road);

  // ヘッドランド堤防（Shape + ExtrudeGeometry で T 字＋丸先端を一体生成）
  // Shape はローカル xy 平面で組み、後で X 軸 -90° で床に倒す
  // ローカル座標: x = ワールドX（東西）、y = -ワールドZ（沖向き正）
  const blockMat = new THREE.MeshStandardMaterial({
    color: 0xc6ccd4,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const stemRoot = -HEADLAND.stem.rootZ; // 陸側起点（=0）
  const stemTip = stemRoot + HEADLAND.stem.length; // 沖側終端（=200）
  const headHalf = HEADLAND.head.width / 2;
  const headBack = stemTip; // T字の陸側エッジ
  const headFront = stemTip + HEADLAND.head.depth - HEADLAND.head.tipRadius;
  const tipR = HEADLAND.head.tipRadius;

  const headland = new THREE.Shape();
  // 陸側付け根 左
  headland.moveTo(-stemHalf - taper, stemRoot);
  // 突堤左エッジ（quadratic で滑らかに細る）
  headland.quadraticCurveTo(
    -stemHalf - taper * 0.4,
    stemRoot + 12,
    -stemHalf,
    stemRoot + 22,
  );
  headland.lineTo(-stemHalf, headBack);
  // T字ヘッド 左の張り出し
  headland.lineTo(-headHalf + tipR, headBack);
  headland.quadraticCurveTo(-headHalf, headBack, -headHalf, headBack + tipR);
  headland.lineTo(-headHalf, headFront);
  // 先端を半円弧で丸める
  headland.absarc(0, headFront, headHalf, Math.PI, 0, true);
  // 右側を対称に戻す
  headland.lineTo(headHalf, headBack + tipR);
  headland.quadraticCurveTo(
    headHalf,
    headBack,
    headHalf - tipR,
    headBack,
  );
  headland.lineTo(stemHalf, headBack);
  headland.lineTo(stemHalf, stemRoot + 22);
  headland.quadraticCurveTo(
    stemHalf + taper * 0.4,
    stemRoot + 12,
    stemHalf + taper,
    stemRoot,
  );
  headland.closePath();

  const headlandGeom = new THREE.ExtrudeGeometry(headland, {
    depth: HEADLAND.head.height,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.4,
    bevelSegments: 1,
    curveSegments: 18,
  });
  const headlandMesh = new THREE.Mesh(headlandGeom, blockMat);
  // ローカル xy（押し出し +z）→ ワールド xz（押し出し +y）に倒す
  // ローカル y（沖方向正）→ ワールド -z（沖方向）。rotation.x=-PI/2 で達成
  headlandMesh.rotation.x = -Math.PI / 2;
  headlandMesh.position.y = 0;
  scene.add(headlandMesh);

  // 監視塔（本部の北側）
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 7, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xb45309 }),
  );
  tower.position.set(-30, 3.5, 35);
  scene.add(tower);

  // 旗ポール（風向きの可視化用）
  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0x111827 }),
  );
  flagPole.position.set(-30, 3, 38);
  scene.add(flagPole);

  // 旗本体（風向きの静的表示）
  const flagGeom = new THREE.PlaneGeometry(3, 1.5);
  flagGeom.translate(1.5, 0, 0); // ピボットを左端に
  const flag = new THREE.Mesh(
    flagGeom,
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
    }),
  );
  flag.position.set(-30, 5.5, 38);
  scene.add(flag);

  return { ocean, flag, flagPole };
}
