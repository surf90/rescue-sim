/** UIコントローラ：再生/停止/リセット、フェーズ表示、経過秒の更新 */
export interface UIHandlers {
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function bindUI(h: UIHandlers) {
  document.getElementById('play')?.addEventListener('click', h.onPlay);
  document.getElementById('pause')?.addEventListener('click', h.onPause);
  document.getElementById('reset')?.addEventListener('click', h.onReset);
}

export function setPhase(label: string) {
  const el = document.getElementById('phase');
  if (el) el.textContent = label;
}

export function setTime(sec: number) {
  const el = document.getElementById('time');
  if (el) el.textContent = sec.toFixed(1);
}
