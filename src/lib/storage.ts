const PREFIX = 'tntrainer:';

export function getKey(name: string): string {
  return `${PREFIX}${name}`;
}

export function setJson<T>(name: string, value: T): void {
  try {
    localStorage.setItem(getKey(name), JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function getJson<T>(name: string, fallback?: T): T | undefined {
  try {
    const raw = localStorage.getItem(getKey(name));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function remove(name: string): void {
  try {
    localStorage.removeItem(getKey(name));
  } catch {
    // ignore
  }
}

export function clearAll(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
