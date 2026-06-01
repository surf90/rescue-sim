import './style.css';
import { createScene } from './scene';
import { buildEnvironment } from './environment';
import { createAssets } from './assets';
import { updateScenario, currentPhase } from './scenario';
import { bindUI, setPhase, setTime } from './ui';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const { scene, camera, renderer, controls } = createScene(canvas);
buildEnvironment(scene);
const assets = createAssets(scene);

// 初期位置スナップショット（リセット用）
const initialPositions = new Map<string, [number, number, number]>();
for (const [k, obj] of Object.entries(assets)) {
  initialPositions.set(k, [obj.position.x, obj.position.y, obj.position.z]);
}

let elapsed = 0;
let isRunning = false;
let lastTs = performance.now();

bindUI({
  onPlay: () => {
    isRunning = true;
    lastTs = performance.now();
  },
  onPause: () => {
    isRunning = false;
  },
  onReset: () => {
    isRunning = false;
    elapsed = 0;
    for (const [k, obj] of Object.entries(assets)) {
      const p = initialPositions.get(k)!;
      obj.position.set(p[0], p[1], p[2]);
    }
    setPhase('待機中');
    setTime(0);
  },
});

setPhase('待機中（再生ボタンで開始）');

function tick() {
  const now = performance.now();
  const dt = (now - lastTs) / 1000;
  lastTs = now;

  if (isRunning) {
    elapsed += dt;
    updateScenario(elapsed, assets);
    setPhase(currentPhase(elapsed));
    setTime(elapsed);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
