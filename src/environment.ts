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

/** 海岸線のような緩やかにうねるエッジ点列を生成（x,z 平面） */
function shorelinePoints(
  z: number,
  amplitude: number,
  segments: number,
  phase: number,
): THREE.Vector2[] {
  const halfW = BEACH.width / 2;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -halfW + t * BEACH.width;
    // 複数周波数の正弦波で自然な揺らぎを作る
    const wobble =
      Math.sin(t * Math.PI * 3 + phase) * amplitude * 0.6 +
      Math.sin(t * Math.PI * 7 + phase * 1.3) * amplitude * 0.4;
    pts.push(new THREE.Vector2(x, z + wobble));
  }
  return pts;
}

/** 多角形 Shape を地表に倒して配置するメッシュを作る */
function makeFlatShape(
  shape: THREE.Shape,
  color: number,
  y: number,
): THREE.Mesh {
  const geom = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

export function buildEnvironment(scene: THREE.Scene): EnvironmentRefs {
  // 海面（広い矩形のまま。砂浜エッジが上に重なるため境界は隠れる）
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(OCEAN.width, OCEAN.depth),
    new THREE.MeshStandardMaterial({ color: 0x1d6fa5 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.02, OCEAN.centerZ);
  ocean.name = 'ocean';
  scene.add(ocean);

  // 砂浜の海側/内陸側エッジ（うねりあり）
  const seaEdgeZ = BEACH.centerZ - BEACH.depth / 2; // 海側
  const landEdgeZ = BEACH.centerZ + BEACH.depth / 2; // 内陸側
  const seaEdge = shorelinePoints(seaEdgeZ, 1.8, 24, 0.7);
  const landEdge = shorelinePoints(landEdgeZ, 0.8, 18, 2.1);

  // 砂浜 Shape（Shape は xy 平面 → 倒して z 平面に）
  const beachShape = new THREE.Shape();
  beachShape.moveTo(seaEdge[0].x, seaEdge[0].y);
  for (let i = 1; i < seaEdge.length; i++) {
    beachShape.lineTo(seaEdge[i].x, seaEdge[i].y);
  }
  for (let i = landEdge.length - 1; i >= 0; i--) {
    beachShape.lineTo(landEdge[i].x, landEdge[i].y);
  }
  beachShape.closePath();
  const beach = makeFlatShape(beachShape, 0xedd9a8, 0);
  // ShapeGeometry は xy 平面で生成され rotation.x=-PI/2 で xz 床面に倒すと
  // y(2D) -> z(3D) のマッピングが反転する。砂浜の Z 値はそのまま使いたいので
  // 倒した後にスケール反転で整合させる
  beach.scale.z = -1;
  scene.add(beach);

  // 波打ち際（海側エッジの内側 2.5m の帯）
  const surfInner = seaEdge.map(
    (p) => new THREE.Vector2(p.x, p.y + 2.5),
  );
  const surfShape = new THREE.Shape();
  surfShape.moveTo(seaEdge[0].x, seaEdge[0].y);
  for (let i = 1; i < seaEdge.length; i++) {
    surfShape.lineTo(seaEdge[i].x, seaEdge[i].y);
  }
  for (let i = surfInner.length - 1; i >= 0; i--) {
    surfShape.lineTo(surfInner[i].x, surfInner[i].y);
  }
  surfShape.closePath();
  const surf = makeFlatShape(surfShape, 0xd6ecff, 0.01);
  surf.scale.z = -1;
  scene.add(surf);

  // プロムナード（駐車場帯）
  const promenade = new THREE.Mesh(
    new THREE.PlaneGeometry(PROMENADE.width, PROMENADE.depth),
    new THREE.MeshStandardMaterial({ color: 0x9ca3af }),
  );
  promenade.rotation.x = -Math.PI / 2;
  promenade.position.set(0, 0.02, PROMENADE.centerZ);
  scene.add(promenade);

  // 国道134号
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD.width, ROAD.depth),
    new THREE.MeshStandardMaterial({ color: 0x4b5563 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.03, ROAD.centerZ);
  scene.add(road);

  // ヘッドランド堤防（Shape + ExtrudeGeometry で T 字＋丸先端を一体生成）
  // Shape はローカル xy 平面で組み、後で X 軸回転して床に倒す
  // ローカル座標: x = ワールドX（東西）、y = ワールド -Z（沖向き正）
  const blockMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
  const stemHalf = HEADLAND.stem.width / 2;
  const stemRoot = -HEADLAND.stem.rootZ; // 陸側起点（ローカル y 増加が沖方向）
  const stemTip = stemRoot + HEADLAND.stem.length; // 沖側終端
  const taper = HEADLAND.rootTaper;
  const headHalf = HEADLAND.head.width / 2;
  const headFront = stemTip + HEADLAND.head.depth - HEADLAND.head.tipRadius - 4;
  // ↑ -4 は旧コードのオフセットと整合させ既存配置を維持
  const headBack = stemTip - 2;

  const headland = new THREE.Shape();
  // 陸側付け根 左 → わずかに広げる
  headland.moveTo(-stemHalf - taper, stemRoot);
  // 突堤左エッジ（quadraticで滑らかに細る）
  headland.quadraticCurveTo(
    -stemHalf - taper * 0.4,
    stemRoot + 8,
    -stemHalf,
    stemRoot + 14,
  );
  headland.lineTo(-stemHalf, headBack);
  // T字ヘッド 左の張り出し
  headland.lineTo(-headHalf + HEADLAND.head.tipRadius, headBack);
  headland.quadraticCurveTo(
    -headHalf,
    headBack,
    -headHalf,
    headBack + HEADLAND.head.tipRadius,
  );
  headland.lineTo(-headHalf, headFront);
  // 先端を半円弧で丸める
  headland.absarc(0, headFront, headHalf, Math.PI, 0, true);
  // 右側を対称に戻す
  headland.lineTo(headHalf, headBack + HEADLAND.head.tipRadius);
  headland.quadraticCurveTo(
    headHalf,
    headBack,
    headHalf - HEADLAND.head.tipRadius,
    headBack,
  );
  headland.lineTo(stemHalf, headBack);
  headland.lineTo(stemHalf, stemRoot + 14);
  headland.quadraticCurveTo(
    stemHalf + taper * 0.4,
    stemRoot + 8,
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
  // ExtrudeGeometry は z 方向に押し出す。床に立てるには X 軸 -90° 回転。
  // その上で y 軸方向（ローカル沖方向）をワールド -Z に合わせる
  const headlandMesh = new THREE.Mesh(headlandGeom, blockMat);
  headlandMesh.rotation.x = -Math.PI / 2;
  // 倒した後 ローカル y → ワールド -Z、押し出し方向（旧+z）→ ワールド +Y
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

  // 旗本体
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
