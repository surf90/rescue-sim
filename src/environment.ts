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

export function buildEnvironment(scene: THREE.Scene): EnvironmentRefs {
  // 海面
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(OCEAN.width, OCEAN.depth),
    new THREE.MeshStandardMaterial({ color: 0x1d6fa5 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.02, OCEAN.centerZ);
  ocean.name = 'ocean';
  scene.add(ocean);

  // 砂浜
  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(BEACH.width, BEACH.depth),
    new THREE.MeshStandardMaterial({ color: 0xedd9a8 }),
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(0, 0, BEACH.centerZ);
  scene.add(beach);

  // 波打ち際
  const surf = new THREE.Mesh(
    new THREE.PlaneGeometry(BEACH.width, 2.5),
    new THREE.MeshStandardMaterial({ color: 0xd6ecff }),
  );
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(0, 0.01, 0);
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

  // T字ヘッドランド堤防（基部突堤）
  const blockMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
  const stem = new THREE.Mesh(
    new THREE.BoxGeometry(HEADLAND.stem.width, HEADLAND.stem.height, HEADLAND.stem.length),
    blockMat,
  );
  stem.position.set(
    0,
    HEADLAND.stem.height / 2,
    HEADLAND.stem.rootZ - HEADLAND.stem.length / 2,
  );
  scene.add(stem);

  // T字ヘッド
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(HEADLAND.head.width, HEADLAND.head.height, HEADLAND.head.depth),
    blockMat,
  );
  head.position.set(
    0,
    HEADLAND.head.height / 2,
    HEADLAND.stem.rootZ - HEADLAND.stem.length - HEADLAND.head.depth / 2 + 4,
  );
  scene.add(head);

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
