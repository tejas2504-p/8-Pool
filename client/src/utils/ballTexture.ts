import * as THREE from 'three';

export const BALL_COLORS: Record<number, string> = {
  0: '#ffffff', // Cue Ball
  1: '#ca8a04', // Darker Yellow
  2: '#1d4ed8', // Darker Blue
  3: '#b91c1c', // Darker Red
  4: '#7e22ce', // Darker Purple
  5: '#c2410c', // Darker Orange
  6: '#15803d', // Darker Green
  7: '#5d1414', // Darker Maroon
  8: '#111111', // Black
  9: '#ca8a04', // Darker Yellow Stripe
  10: '#1d4ed8', // Darker Blue Stripe
  11: '#b91c1c', // Darker Red Stripe
  12: '#7e22ce', // Darker Purple Stripe
  13: '#c2410c', // Darker Orange Stripe
  14: '#15803d', // Darker Green Stripe
  15: '#5d1414', // Darker Maroon Stripe
};

const textureCache: Record<number, THREE.CanvasTexture> = {};

export const getBallTexture = (number: number): THREE.CanvasTexture => {
  if (textureCache[number]) {
    return textureCache[number];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const texture = new THREE.CanvasTexture(canvas);
    textureCache[number] = texture;
    return texture;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const color = BALL_COLORS[number] || '#ffffff';

  if (number === 0) {
    // Cue Ball: Solid white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 256);
  } else {
    const isStripe = number > 8;
    if (isStripe) {
      // Stripe Ball: White background with a colored stripe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 256);

      ctx.fillStyle = color;
      // Stripe height: from V = 0.25 to V = 0.75, which is y = 64 to 192 (height = 128)
      const stripeHeight = 128;
      const stripeTop = 64;
      ctx.fillRect(0, stripeTop, 512, stripeHeight);
    } else {
      // Solid Ball: Solid color background
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 512, 256);
    }

    // Draw white circle & number on opposite sides
    // Circle 1: x = 128 (0.25 * 512), y = 128
    // Circle 2: x = 384 (0.75 * 512), y = 128
    const circleRadius = 38;
    const drawCircleAndNumber = (cx: number, cy: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Number text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number.toString(), cx, cy + 2); // +2 offset for vertical visual centering
    };

    drawCircleAndNumber(128, 128);
    drawCircleAndNumber(384, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  textureCache[number] = texture;
  return texture;
};
