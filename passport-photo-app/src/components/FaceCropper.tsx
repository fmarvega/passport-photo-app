import React, { useState, useEffect, useCallback } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Box } from '../types';
import { area2rect } from '../utils/geometry';

interface FaceCropperProps {
  imageSrc: string;
  initialBox: Box;             // natural pixels (already clamped)
  faceBox: Box | null;         // natural pixels
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  onCropComplete: (finalBoxNatural: Box) => void;
}

export function FaceCropper({
  imageSrc,
  initialBox,
  faceBox,
  imageNaturalWidth,
  imageNaturalHeight,
  onCropComplete,
}: FaceCropperProps) {
  // State: crop always in percentages
  const [crop, setCrop] = useState<Crop>(() => ({
    unit: '%',
    x: (initialBox.x / imageNaturalWidth) * 100,
    y: (initialBox.y / imageNaturalHeight) * 100,
    width: (initialBox.width / imageNaturalWidth) * 100,
    height: (initialBox.height / imageNaturalHeight) * 100,
  }));

  // Convert percentage crop to natural pixels and call parent
  const confirmCrop = useCallback(
    (currentCrop: Crop) => {
      const finalBox: Box = {
        x: Math.round(((currentCrop.x as number) / 100) * imageNaturalWidth),
        y: Math.round(((currentCrop.y as number) / 100) * imageNaturalHeight),
        width: Math.round(((currentCrop.width as number) / 100) * imageNaturalWidth),
        height: Math.round(((currentCrop.height as number) / 100) * imageNaturalHeight),
      };
      onCropComplete(finalBox);
    },
    [imageNaturalWidth, imageNaturalHeight, onCropComplete]
  );

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const delta = e.shiftKey ? 0.2 : 1.5; // percentage steps
      let newCrop = { ...crop };

      switch (e.key) {
        case 'ArrowLeft':
          newCrop.x = (crop.x as number) - delta;
          break;
        case 'ArrowRight':
          newCrop.x = (crop.x as number) + delta;
          break;
        case 'ArrowUp':
          newCrop.y = (crop.y as number) - delta;
          break;
        case 'ArrowDown':
          newCrop.y = (crop.y as number) + delta;
          break;

        case 'o': // Reset to initial crop
          newCrop = {
            unit: '%',
            x: (initialBox.x / imageNaturalWidth) * 100,
            y: (initialBox.y / imageNaturalHeight) * 100,
            width: (initialBox.width / imageNaturalWidth) * 100,
            height: (initialBox.height / imageNaturalHeight) * 100,
          };
          break;

        case 'c': {
          // Re-center on face while keeping current area
          if (!faceBox) return;

          // Convert current % to natural pixels
          const currentW = ((crop.width as number) / 100) * imageNaturalWidth;
          const currentH = ((crop.height as number) / 100) * imageNaturalHeight;
          const currentArea = currentW * currentH;

          const faceArea = faceBox.width * faceBox.height;
          const factor = currentArea / faceArea;

          // Compute ideal box in natural pixels
          const newBoxNatural = area2rect(faceBox, 32 / 26, factor);

          // Clamp to image bounds – prevents overflow on extreme close-ups
          let finalW = newBoxNatural.width;
          let finalH = newBoxNatural.height;

          if (finalW > imageNaturalWidth) {
            finalW = imageNaturalWidth;
            finalH = Math.round(finalW * (32 / 26));
          }
          if (finalH > imageNaturalHeight) {
            finalH = imageNaturalHeight;
            finalW = Math.round(finalH * (26 / 32));
          }

          // Recalculate position so the box stays centred on the face
          let finalX = Math.round((faceBox.x + faceBox.width / 2) - finalW / 2);
          let finalY = Math.round((faceBox.y + faceBox.height / 2) - finalH / 2);

          // Hard clamp to image edges
          finalX = Math.max(0, Math.min(finalX, imageNaturalWidth - finalW));
          finalY = Math.max(0, Math.min(finalY, imageNaturalHeight - finalH));

          // Convert back to percentages
          newCrop = {
            unit: '%',
            x: (finalX / imageNaturalWidth) * 100,
            y: (finalY / imageNaturalHeight) * 100,
            width: (finalW / imageNaturalWidth) * 100,
            height: (finalH / imageNaturalHeight) * 100,
          };
          break;
        }

        case 'Enter':
          confirmCrop(crop);
          return;

        default:
          return;
      }

      // Clamp to [0%, 100%] range
      newCrop.x = Math.max(0, Math.min(newCrop.x as number, 100 - (newCrop.width as number)));
      newCrop.y = Math.max(0, Math.min(newCrop.y as number, 100 - (newCrop.height as number)));

      setCrop(newCrop);
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [crop, faceBox, initialBox, imageNaturalWidth, imageNaturalHeight, confirmCrop]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="max-w-full overflow-hidden border border-gray-200 bg-gray-100 rounded shadow-inner">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          aspect={26 / 32}
        >
          <img
            src={imageSrc}
            alt="Crop preview"
            style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
          />
        </ReactCrop>
      </div>

      <button
        onClick={() => confirmCrop(crop)}
        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        Confirm Crop & Create Template
      </button>
    </div>
  );
}