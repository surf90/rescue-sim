import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/** Three.js のシーン基盤を初期化して返す */
export function createScene(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 200, 800);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1500,
  );
  camera.position.set(0, 200, 200);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minDistance = 25;
  controls.maxDistance = 450;
  controls.target.set(0, 0, -100);

  // 環境光と太陽光
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(30, 60, 20);
  scene.add(sun);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls };
}
