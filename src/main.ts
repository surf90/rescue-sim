import './style.css';
import * as THREE from 'three';
import { createScene } from './scene';
import { buildEnvironment } from './environment';
import { createAssets } from './assets';
import { createVictim, OceanPicker } from './victim';
import {
  PRESET_SCENARIOS,
  updateScenario,
  currentPhase,
  findScenario,
  emptyScenario,
} from './scenario';
import type { Scenario } from './scenario-types';
import {
  DEFAULT_ENV,
  type EnvState,
  type Season,
  type Weather,
  type WindDir,
  type VictimType,
} from './environment-state';
import { applyEnv, collectWeatherRefs } from './weather';
import {
  loadCustomScenarios,
  saveCustomScenarios,
  exportScenarioJson,
  importScenarioJson,
} from './storage';
import { ScenarioBuilder, removeEvent, addPhase, removePhase } from './builder';
import { $, on, setText, setupDrawers } from './ui';

// === シーン構築 ===
const canvas = $('scene') as HTMLCanvasElement;
const { scene, camera, renderer, controls } = createScene(canvas);
const envRefs = buildEnvironment(scene);
const weatherRefs = collectWeatherRefs(scene, envRefs);
const assets = createAssets(scene);

// 要救助者は別管理（種別切替で差し替える）
let victim = createVictim('swimmer');
scene.add(victim);
assets.victim = victim;

// 初期位置スナップショット
const initialPositions = new Map<string, [number, number, number]>();
function snapshotInitialPositions() {
  initialPositions.clear();
  for (const [k, obj] of Object.entries(assets)) {
    initialPositions.set(k, [obj.position.x, obj.position.y, obj.position.z]);
  }
}
snapshotInitialPositions();

// === 状態 ===
let env: EnvState = structuredClone(DEFAULT_ENV);
let customScenarios: Scenario[] = loadCustomScenarios();
let allScenarios: Scenario[] = [...PRESET_SCENARIOS, ...customScenarios];
let activeScenario: Scenario =
  findScenario(allScenarios, env.scenarioId) ?? PRESET_SCENARIOS[0];

let elapsed = 0;
let isRunning = false;
let lastTs = performance.now();

// === Builder ===
const builder = new ScenarioBuilder(
  canvas,
  camera,
  [envRefs.ocean, ...scene.children.filter((c) => c.name === '' && false)],
  assets,
);
// 砂浜も pick 対象にしたいので環境構築時にメッシュを名前付きで取り直す方が綺麗だが、
// ここでは ocean を主たる pick 対象にし、砂浜はクリック反応外とする（編集時は沖中心）。

// === ピッカー（要救助者初期位置） ===
const picker = new OceanPicker(canvas, camera, envRefs.ocean);

// === 初期描画反映 ===
applyEnv(weatherRefs, env);
victim.position.set(env.victim.position[0], 0, env.victim.position[1]);
initialPositions.set('victim', [victim.position.x, victim.position.y, victim.position.z]);

// === UI 構築 ===
setupDrawers();
populateScenarioSelect();
syncEnvUI();
refreshBuilderLists();

// --- 再生コントロール ---
on('play', 'click', () => {
  isRunning = true;
  lastTs = performance.now();
});
on('pause', 'click', () => {
  isRunning = false;
});
on('reset', 'click', () => {
  isRunning = false;
  elapsed = 0;
  for (const [k, obj] of Object.entries(assets)) {
    const p = initialPositions.get(k);
    if (p) obj.position.set(p[0], p[1], p[2]);
  }
  setText('phase', '待機中');
  setText('time', '0.0');
});

// --- シナリオ選択 ---
function populateScenarioSelect() {
  const sel = $('scenario-select') as HTMLSelectElement;
  sel.innerHTML = '';
  for (const s of allScenarios) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = (s.custom ? '★ ' : '') + s.name;
    sel.appendChild(opt);
  }
  sel.value = activeScenario.id;
  setText('scenario-desc', activeScenario.description ?? '');
  ($('scenario-name') as HTMLInputElement).value = activeScenario.name;
}

on('scenario-select', 'change', (e) => {
  const id = (e.target as HTMLSelectElement).value;
  const s = findScenario(allScenarios, id);
  if (s) {
    activeScenario = s;
    env.scenarioId = id;
    setText('scenario-desc', s.description ?? '');
    ($('scenario-name') as HTMLInputElement).value = s.name;
    refreshBuilderLists();
    resetSim();
  }
});

(['1', '2', '4'] as const).forEach((r) => {
  on(`speed-${r}`, 'click', () => {
    env.playbackRate = Number(r);
    setText('rate-val', r);
  });
});

on('export-json', 'click', () => {
  const text = exportScenarioJson(activeScenario);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeScenario.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

on('import-json', 'change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    const txt = await f.text();
    const s = importScenarioJson(txt);
    customScenarios.push(s);
    saveCustomScenarios(customScenarios);
    allScenarios = [...PRESET_SCENARIOS, ...customScenarios];
    activeScenario = s;
    env.scenarioId = s.id;
    populateScenarioSelect();
    refreshBuilderLists();
    resetSim();
  } catch (err) {
    alert('読み込み失敗: ' + (err as Error).message);
  }
});

on('delete-scenario', 'click', () => {
  if (!activeScenario.custom) {
    alert('プリセットは削除できません');
    return;
  }
  if (!confirm(`「${activeScenario.name}」を削除しますか？`)) return;
  customScenarios = customScenarios.filter((s) => s.id !== activeScenario.id);
  saveCustomScenarios(customScenarios);
  allScenarios = [...PRESET_SCENARIOS, ...customScenarios];
  activeScenario = PRESET_SCENARIOS[0];
  env.scenarioId = activeScenario.id;
  populateScenarioSelect();
  refreshBuilderLists();
  resetSim();
});

// --- 要救助者 ---
on('victim-type', 'change', (e) => {
  const t = (e.target as HTMLSelectElement).value as VictimType;
  env.victim.type = t;
  scene.remove(victim);
  victim = createVictim(t);
  victim.position.set(env.victim.position[0], 0, env.victim.position[1]);
  scene.add(victim);
  assets.victim = victim;
  initialPositions.set('victim', [victim.position.x, 0, victim.position.y]);
  resetSim();
});

on('pick-position', 'click', () => {
  alert('海面をタップしてください');
  picker.enable((x, z) => {
    env.victim.position = [x, z];
    victim.position.set(x, 0, z);
    initialPositions.set('victim', [x, 0, z]);
    setText('victim-pos', `x=${x.toFixed(1)}, z=${z.toFixed(1)}`);
    picker.disable();
  });
});

// --- 環境 ---
function syncEnvUI() {
  ($('season') as HTMLSelectElement).value = env.season;
  ($('weather') as HTMLSelectElement).value = env.weather;
  ($('wind-dir') as HTMLSelectElement).value = env.windDir;
  ($('wind-speed') as HTMLInputElement).value = String(env.windSpeed);
  setText('wind-speed-val', String(env.windSpeed));
  setText('victim-pos', `x=${env.victim.position[0]}, z=${env.victim.position[1]}`);
  ($('victim-type') as HTMLSelectElement).value = env.victim.type;
}

on('season', 'change', (e) => {
  env.season = (e.target as HTMLSelectElement).value as Season;
  applyEnv(weatherRefs, env);
});
on('weather', 'change', (e) => {
  env.weather = (e.target as HTMLSelectElement).value as Weather;
  applyEnv(weatherRefs, env);
});
on('wind-dir', 'change', (e) => {
  env.windDir = (e.target as HTMLSelectElement).value as WindDir;
  applyEnv(weatherRefs, env);
});
on('wind-speed', 'input', (e) => {
  env.windSpeed = Number((e.target as HTMLInputElement).value);
  setText('wind-speed-val', String(env.windSpeed));
  applyEnv(weatherRefs, env);
});

// --- Builder UI ---
on('edit-mode', 'change', (e) => {
  const on = (e.target as HTMLInputElement).checked;
  if (on) {
    builder.start(activeScenario, () => refreshBuilderLists());
  } else {
    builder.stop();
  }
});
on('edit-asset', 'change', (e) => {
  builder.selectedAsset = (e.target as HTMLSelectElement).value as any;
});
on('edit-time', 'input', (e) => {
  const v = Number((e.target as HTMLInputElement).value);
  builder.currentTime = v;
  setText('edit-time-val', v.toFixed(1));
});

on('new-scenario', 'click', () => {
  const name = prompt('新規シナリオ名', `カスタム ${customScenarios.length + 1}`);
  if (!name) return;
  const s = emptyScenario(name);
  customScenarios.push(s);
  allScenarios = [...PRESET_SCENARIOS, ...customScenarios];
  activeScenario = s;
  env.scenarioId = s.id;
  saveCustomScenarios(customScenarios);
  populateScenarioSelect();
  refreshBuilderLists();
});

on('save-scenario', 'click', () => {
  const name = ($('scenario-name') as HTMLInputElement).value.trim();
  if (!name) return;
  activeScenario.name = name;
  if (!activeScenario.custom) {
    // プリセット編集中の保存はクローンして保存
    const clone: Scenario = {
      ...activeScenario,
      id: `custom-${Date.now()}`,
      name,
      custom: true,
      events: structuredClone(activeScenario.events),
      phases: structuredClone(activeScenario.phases),
    };
    customScenarios.push(clone);
    activeScenario = clone;
    env.scenarioId = clone.id;
  } else {
    // 既存カスタムを上書き
    const idx = customScenarios.findIndex((s) => s.id === activeScenario.id);
    if (idx >= 0) customScenarios[idx] = activeScenario;
    else customScenarios.push(activeScenario);
  }
  allScenarios = [...PRESET_SCENARIOS, ...customScenarios];
  saveCustomScenarios(customScenarios);
  populateScenarioSelect();
  alert('保存しました');
});

on('add-phase', 'click', () => {
  const t = Number(($('phase-time') as HTMLInputElement).value);
  const label = ($('phase-label') as HTMLInputElement).value.trim();
  if (!label || Number.isNaN(t)) return;
  addPhase(activeScenario, { time: t, label });
  refreshBuilderLists();
});

function refreshBuilderLists() {
  const evUl = $('event-list');
  evUl.innerHTML = '';
  activeScenario.events.forEach((ev, i) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between gap-1 bg-slate-800 rounded px-2 py-1';
    li.innerHTML = `<span>${ev.time.toFixed(1)}s · ${ev.asset} → (${ev.target[0].toFixed(0)}, ${ev.target[2].toFixed(0)})</span>
      <button data-idx="${i}" class="del-ev text-rose-400">×</button>`;
    evUl.appendChild(li);
  });
  evUl.querySelectorAll<HTMLButtonElement>('.del-ev').forEach((b) => {
    b.addEventListener('click', () => {
      removeEvent(activeScenario, Number(b.dataset.idx));
      refreshBuilderLists();
    });
  });

  const phUl = $('phase-list');
  phUl.innerHTML = '';
  activeScenario.phases.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between gap-1 bg-slate-800 rounded px-2 py-1';
    li.innerHTML = `<span>${p.time.toFixed(1)}s · ${p.label}</span>
      <button data-idx="${i}" class="del-ph text-rose-400">×</button>`;
    phUl.appendChild(li);
  });
  phUl.querySelectorAll<HTMLButtonElement>('.del-ph').forEach((b) => {
    b.addEventListener('click', () => {
      removePhase(activeScenario, Number(b.dataset.idx));
      refreshBuilderLists();
    });
  });
}

function resetSim() {
  isRunning = false;
  elapsed = 0;
  for (const [k, obj] of Object.entries(assets)) {
    const p = initialPositions.get(k);
    if (p) obj.position.set(p[0], p[1], p[2]);
  }
  setText('time', '0.0');
  setText('phase', '待機中');
}

// === メインループ ===
function tick() {
  const now = performance.now();
  const dt = (now - lastTs) / 1000;
  lastTs = now;

  if (isRunning) {
    elapsed += dt * env.playbackRate;
    updateScenario(elapsed, assets, activeScenario);
    setText('phase', currentPhase(elapsed, activeScenario));
    setText('time', elapsed.toFixed(1));
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();

// Three.js を遅延参照されないよう明示的に保持
void THREE;
