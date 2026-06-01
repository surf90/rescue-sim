import * as THREE from 'three';

/** 砂浜・海・本部テントなどの静的環境を追加する */
export function buildEnvironment(scene: THREE.Scene) {
  // 海
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 140),
    new THREE.MeshStandardMaterial({ color: 0x1d6fa5 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.02, -60);
  scene.add(ocean);

  // 砂浜
  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 50),
    new THREE.MeshStandardMaterial({ color: 0xedd9a8 }),
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(0, 0, 25);
  scene.add(beach);

  // 波打ち際のライン
  const surf = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 2),
    new THREE.MeshStandardMaterial({ color: 0xc9e8ff }),
  );
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(0, 0.01, 0);
  scene.add(surf);

  // パトロール本部テント
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(3, 3, 4),
    new THREE.MeshStandardMaterial({ color: 0xdc2626 }),
  );
  tent.position.set(-15, 1.5, 30);
  tent.rotation.y = Math.PI / 4;
  scene.add(tent);

  // 監視塔
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(2, 6, 2),
    new THREE.MeshStandardMaterial({ color: 0xb45309 }),
  );
  tower.position.set(0, 3, 32);
  scene.add(tower);
}
