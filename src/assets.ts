import * as THREE from 'three';

export type AssetKey =
  | 'patrol'
  | 'tube'
  | 'board'
  | 'irb'
  | 'pwc'
  | 'drone'
  | 'victim';

export type AssetMap = Record<AssetKey, THREE.Object3D>;

/** 救助アセット（victim除く）を生成。victim は victim.ts 経由で別途差し替え */
export function createAssets(scene: THREE.Scene): AssetMap {
  const assets: Partial<AssetMap> = {
    patrol: makeBox(0xef4444, 3.5, 1.4, 2.4, [-30, 0.7, 40]),
    tube: makeBox(0xfb923c, 1.2, 0.4, 0.6, [-6, 0.2, 33]),
    board: makeBox(0xfacc15, 0.8, 0.3, 3, [6, 0.15, 33]),
    irb: makeBoat(0xe879f9, [20, 0.5, 36]),
    pwc: makeBoat(0x22d3ee, [30, 0.5, 36]),
    drone: makeDrone(0x4ade80, [-30, 0.5, 40]),
  };
  Object.values(assets).forEach((m) => m && scene.add(m));
  return assets as AssetMap;
}

function makeBox(
  color: number,
  w: number,
  h: number,
  d: number,
  pos: [number, number, number],
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color }),
  );
  mesh.position.set(...pos);
  return mesh;
}

function makeBoat(color: number, pos: [number, number, number]) {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.6, 3.6),
    new THREE.MeshStandardMaterial({ color }),
  );
  group.add(hull);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x111827 }),
  );
  deck.position.set(0, 0.5, -0.4);
  group.add(deck);
  group.position.set(...pos);
  return group;
}

function makeDrone(color: number, pos: [number, number, number]) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.3, 1),
    new THREE.MeshStandardMaterial({ color }),
  );
  group.add(body);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
  [
    [0.9, 0, 0.9],
    [-0.9, 0, 0.9],
    [0.9, 0, -0.9],
    [-0.9, 0, -0.9],
  ].forEach(([x, y, z]) => {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 12), armMat);
    r.position.set(x, y, z);
    group.add(r);
  });
  group.position.set(...pos);
  return group;
}
