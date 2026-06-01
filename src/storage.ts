import type { Scenario } from './scenario-types';

const KEY = 'rescue-sim:custom-scenarios:v1';

export function loadCustomScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Scenario[];
    return Array.isArray(arr) ? arr.map((s) => ({ ...s, custom: true })) : [];
  } catch {
    return [];
  }
}

export function saveCustomScenarios(list: Scenario[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function exportScenarioJson(s: Scenario): string {
  return JSON.stringify(s, null, 2);
}

export function importScenarioJson(text: string): Scenario {
  const obj = JSON.parse(text);
  if (!obj.id || !Array.isArray(obj.events) || !Array.isArray(obj.phases)) {
    throw new Error('シナリオJSONの形式が不正です');
  }
  return { ...obj, custom: true } as Scenario;
}
