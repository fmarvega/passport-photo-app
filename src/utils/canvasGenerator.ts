const DPCM = 300 / 2.54;   // dots per cm (≈118.11)
const CANVAS_CM_WIDTH = 15;
const CANVAS_CM_HEIGHT = 10;
const PHOTO_CM_WIDTH = 2.6;
const PHOTO_CM_HEIGHT = 3.2;
const N_HORIZ = 5;
const N_VERT = 3;

const CANVAS_PX_WIDTH = Math.round(CANVAS_CM_WIDTH * DPCM);   // 1772
const CANVAS_PX_HEIGHT = Math.round(CANVAS_CM_HEIGHT * DPCM); // 1181
const PHOTO_PX_WIDTH = Math.round(PHOTO_CM_WIDTH * DPCM);     // 307
const PHOTO_PX_HEIGHT = Math.round(PHOTO_CM_HEIGHT * DPCM);   // 378

export function generateTemplate(
  image: HTMLImageElement,
  cropBox: { x: number; y: number; width: number; height: number } // natural pixels
): string {
  // 1. Main canvas (white background)
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_PX_WIDTH;
  canvas.height = CANVAS_PX_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Extract the cropped region at its original resolution
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cropBox.width;
  tempCanvas.height = cropBox.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(
    image,
    cropBox.x, cropBox.y, cropBox.width, cropBox.height,
    0, 0, cropBox.width, cropBox.height
  );

  // 3. Dynamic margins (same logic as MATLAB)
  const sepHoriz = Math.floor((CANVAS_PX_WIDTH - PHOTO_PX_WIDTH * N_HORIZ) / (N_HORIZ + 1));
  const sepVert = Math.floor((CANVAS_PX_HEIGHT - PHOTO_PX_HEIGHT * N_VERT) / (N_VERT + 1));

  // 4. Draw the 5×3 grid
  for (let i = 1; i <= N_HORIZ; i++) {
    for (let j = 1; j <= N_VERT; j++) {
      const x = (i - 1) * PHOTO_PX_WIDTH + i * sepHoriz;
      const y = (j - 1) * PHOTO_PX_HEIGHT + j * sepVert;
      ctx.drawImage(tempCanvas, x, y, PHOTO_PX_WIDTH, PHOTO_PX_HEIGHT);
    }
  }

  // 5. Return JPEG data URL (maximum quality)
  return canvas.toDataURL('image/jpeg', 1.0);
}