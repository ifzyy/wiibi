import {
  Tv,
  Wind,
  Sun,
  CloudSnow,
  Smartphone,
  Droplet,
  Box,
  RotateCcw,
  Wifi,
  Camera,
  Laptop,
} from 'lucide-react';

const normalizeLabel = (label) =>
  String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const DEVICE_ICON_MAP = Object.freeze({
  tv: Tv,
  fan: Wind,
  light: Sun,
  'air condition': CloudSnow,
  'air conditioner': CloudSnow,
  'air conditioning': CloudSnow,
  gadgets: Smartphone,
  'smart pump': Droplet,
  fridge: Box,
  'washing machine': RotateCcw,
  microwave: Box,
  router: Wifi,
  cctv: Camera,
  'water pump': Droplet,
  laptop: Laptop,
});

const DEFAULT_ICON = Box;

export const getPoweredDeviceIcon = (labelOrIcon) => {
  if (!labelOrIcon) return DEFAULT_ICON;
  if (typeof labelOrIcon === 'function') return labelOrIcon;

  const normalized = normalizeLabel(labelOrIcon);
  return DEVICE_ICON_MAP[normalized] || DEFAULT_ICON;
};

export const normalizePoweredDevice = (device) => {
  if (!device) return null;

  if (typeof device === 'string') {
    const label = device.trim();
    return {
      label,
      icon: getPoweredDeviceIcon(label),
    };
  }

  const label = String(device.label ?? device.name ?? '').trim();
  if (!label) return null;

  if (typeof device.icon === 'function') {
    return { label, icon: device.icon };
  }

  const iconSource = device.icon ?? label;
  return {
    label,
    icon: getPoweredDeviceIcon(iconSource),
  };
};

export const normalizePoweredDevices = (devices = []) => {
  if (!Array.isArray(devices)) {
    try {
      const parsed = JSON.parse(devices);
      if (Array.isArray(parsed)) devices = parsed;
    } catch {
      return [];
    }
  }

  return devices
    .map(normalizePoweredDevice)
    .filter(Boolean);
};
