export const hexToHslStr = (hex: string): string => {
  // Fallback seguro se não for uma string válida
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return "221 83% 53%"; // Cor primária padrão
  }

  try {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    } else {
      return "221 83% 53%";
    }
    
    r /= 255;
    g /= 255;
    b /= 255;
    const cmin = Math.min(r, g, b),
          cmax = Math.max(r, g, b),
          delta = cmax - cmin;
    let h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `${h} ${s}% ${l}%`;
  } catch (e) {
    console.warn('[Colors] Erro ao converter hex:', hex, e);
    return "221 83% 53%";
  }
};
