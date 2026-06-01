/** DOM ヘルパ群（軽量・型安全寄り） */

export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

export function on<K extends keyof HTMLElementEventMap>(
  id: string,
  ev: K,
  fn: (e: HTMLElementEventMap[K]) => void,
) {
  $(id).addEventListener(ev, fn as EventListener);
}

export function setText(id: string, text: string) {
  $(id).textContent = text;
}

/** ドロワー開閉（左上ナビボタンと連動） */
export function setupDrawers() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.drawer-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.drawer!;
      const target = document.getElementById(`drawer-${key}`);
      if (!target) return;
      const willOpen = target.classList.contains('hidden');
      document
        .querySelectorAll('.drawer')
        .forEach((d) => d.classList.add('hidden'));
      if (willOpen) target.classList.remove('hidden');
    });
  });
  // 背景タップで閉じる：シーンキャンバスをタップした時に閉じる
  document.getElementById('scene')?.addEventListener('pointerdown', () => {
    document.querySelectorAll('.drawer').forEach((d) => d.classList.add('hidden'));
  });
}
