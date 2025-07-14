// Utility to get the lightest non-white color from an image URL
export async function getLightestColorFromImage(url) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      let lightest = { r: 0, g: 0, b: 0, sum: 0 };
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        // Ignore transparent and white pixels
        if (a < 200) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        // Ignore greyscale (r, g, b nearly equal)
        if (Math.abs(r-g) < 10 && Math.abs(r-b) < 10 && Math.abs(g-b) < 10) continue;
        const sum = r + g + b;
        if (sum > lightest.sum) {
          lightest = { r, g, b, sum };
        }
      }
      if (lightest.sum === 0) {
        // fallback to a default light gray
        resolve('#f0f0f0');
      } else {
        resolve(`rgb(${lightest.r},${lightest.g},${lightest.b})`);
      }
    };
    img.onerror = function () {
      resolve('#f0f0f0');
    };
    img.src = url;
  });
}
