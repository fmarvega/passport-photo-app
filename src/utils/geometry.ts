import { Box } from '../types';

/**
 * Generates a centered square covering approx. 1/4 of the image height.
 * Used as a fallback when no face is detected.
 * NOTE: The original MATLAB code accidentally swapped axes – this version fixes that.
 */
export function centeredSquare(imageWidth: number, imageHeight: number): Box {
  const side = Math.round(imageHeight / 4);
  // `x` uses image width, `y` uses image height
  const x = Math.floor(imageWidth / 2) - Math.round(side / 2);
  const y = Math.floor(imageHeight / 2) - Math.round(side / 2);
  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: side,
    height: side,
  };
}

/**
 * Transforms a face bounding box into a new rectangle with a fixed aspect ratio
 * and a given area scale factor. The result is always centered on the original box.
 *
 * @param bbox1      – Original face box (natural pixels)
 * @param heightOverWidthAspect – Desired height/width ratio (e.g. 32/26)
 * @param factor     – Area scale factor (area2 / area1)
 * @returns A new Box with width/height = 1 / heightOverWidthAspect (i.e. 26/32)
 */
export function area2rect(
  bbox1: Box,
  heightOverWidthAspect: number,
  factor: number
): Box {
  const area1 = bbox1.width * bbox1.height;
  const area2 = area1 * factor;

  // Target width/height ratio = 1 / heightOverWidthAspect
  const targetWidthOverHeight = 1 / heightOverWidthAspect; // e.g. 26/32

  // Solve: width = area2 / height,  and width / height = targetWidthOverHeight
  const newHeight = Math.sqrt(area2 / targetWidthOverHeight);
  const newWidth = area2 / newHeight;

  const centerX = bbox1.x + bbox1.width / 2;
  const centerY = bbox1.y + bbox1.height / 2;

  return {
    x: Math.round(centerX - newWidth / 2),
    y: Math.round(centerY - newHeight / 2),
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}