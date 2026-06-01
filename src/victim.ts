import * as THREE from 'three';
import type { VictimType } from './environment-state';

/** 要救助者種別ごとに簡易3Dモデルを生成 */
export function createVictim(type: VictimType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'victim';

  switch (type) {
    case 'swimmer': {
      // 頭だけ水面に出ているイメージ
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xffe0bd }),
      );
      head.position.y = 0.4;
      group.add(head);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.52, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xef4444 }),
      );
      cap.position.y = 0.4;
      group.add(cap);
      break;
    }
    case 'surfer': {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.15, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
      );
      board.position.y = 0.1;
      group.add(board);
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.3, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x1f2937 }),
      );
      body.position.y = 0.35;
      group.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xffe0bd }),
      );
      head.position.set(0, 0.7, -0.6);
      group.add(head);
      break;
    }
    case 'sup': {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.2, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa }),
      );
      board.position.y = 0.1;
      group.add(board);
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 1.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x10b981 }),
      );
      torso.position.y = 0.8;
      group.add(torso);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xffe0bd }),
      );
      head.position.y = 1.6;
      group.add(head);
      const paddle = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.8, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      );
      paddle.position.set(0.4, 1.1, 0);
      paddle.rotation.z = 0.3;
      group.add(paddle);
      break;
    }
  }
  return group;
}

/** 海面メッシュをタップ/クリックしてワールド座標を返すピッカー */
export class OceanPicker {
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private listener?: (ev: PointerEvent) => void;

  constructor(
    private dom: HTMLElement,
    private camera: THREE.Camera,
    private ocean: THREE.Object3D,
  ) {}

  enable(onPick: (x: number, z: number) => void) {
    this.disable();
    this.listener = (ev) => {
      const rect = this.dom.getBoundingClientRect();
      this.ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      this.ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.ndc, this.camera);
      const hits = this.raycaster.intersectObject(this.ocean, false);
      if (hits.length > 0) {
        const p = hits[0].point;
        onPick(p.x, p.z);
      }
    };
    this.dom.addEventListener('pointerdown', this.listener);
    this.dom.style.cursor = 'crosshair';
  }

  disable() {
    if (this.listener) {
      this.dom.removeEventListener('pointerdown', this.listener);
      this.listener = undefined;
    }
    this.dom.style.cursor = '';
  }
}
