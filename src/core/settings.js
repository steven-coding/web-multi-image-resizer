const STORAGE_KEY = 'multi-image-resizer-settings';

const DEFAULTS = {
  targetWidth: 800,
  targetHeight: 0,
  maintainAspectRatio: true,
  outputFormat: 'jpeg',
  quality: 80,
  border: {
    enabled: false,
    size: 0,
    color: '#ffffff',
  },
  watermark: {
    enabled: false,
    text: '',
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#ffffff',
    opacity: 50,
    position: 'bottom-right',
  },
  rename: {
    enabled: false,
    pattern: 'image-xxx',
    startNumber: 1,
  },
};

export function getDefaults() {
  return structuredClone(DEFAULTS);
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return deepMerge(getDefaults(), saved);
    }
  } catch {
    // ignore parse errors
  }
  return getDefaults();
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
