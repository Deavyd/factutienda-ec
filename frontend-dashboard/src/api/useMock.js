const MOCK_DELAY_MS = 120;

export function isMockEnabled() {
  return import.meta.env.VITE_USE_MOCK === "true";
}

export function mockResolve(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(clone(data));
    }, MOCK_DELAY_MS);
  });
}

export function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

export function nextId(items) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return maxId + 1;
}
