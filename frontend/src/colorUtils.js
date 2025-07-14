// Utility to darken an RGB or hex color by a percentage
export function darkenColor(color, percent) {
  let r, g, b;
  if (color.startsWith('#')) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (color.startsWith('rgb')) {
    [r, g, b] = color.match(/\d+/g).map(Number);
  } else {
    // fallback to gray
    r = g = b = 240;
  }
  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));
  return `rgb(${r},${g},${b})`;
}
