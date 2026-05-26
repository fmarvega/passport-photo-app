import { useState, useEffect, useCallback, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { Box } from '../types';
import { area2rect } from '../utils/geometry';

interface FaceCropperProps {
  imageSrc: string;
  initialBox: Box;
  faceBox: Box | null;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  onCropComplete: (finalBoxNatural: Box) => void;
}

// Step multipliers: ×1 = 0.3%, ×2 = 0.6%, ×5 = 1.5%, ×10 = 3.0%
const STEP_VALUES = { '1': 0.3, '2': 0.6, '5': 1.5, '10': 3.0 };

export function FaceCropper({
  imageSrc,
  initialBox,
  faceBox,
  imageNaturalWidth,
  imageNaturalHeight,
  onCropComplete,
}: FaceCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cropRef = useRef<Crop | null>(null);
  const stepRef = useRef<keyof typeof STEP_VALUES>('1');

  const [crop, setCropState] = useState<Crop>(() => {
    const x = initialBox.x || 0;
    const y = initialBox.y || 0;
    const width = initialBox.width || 100;
    const height = initialBox.height || 100;
    return {
      unit: '%' as const,
      x: (x / imageNaturalWidth) * 100,
      y: (y / imageNaturalHeight) * 100,
      width: (width / imageNaturalWidth) * 100,
      height: (height / imageNaturalHeight) * 100,
    };
  });

  // Keep cropRef in sync with crop state
  useEffect(() => {
    cropRef.current = crop;
  }, [crop]);

  // Normalize crop to percentage units before storing
  const normalizeToPercentage = useCallback((c: Crop) => {
    if ((c.unit as string) === '%' || c.unit === undefined) {
      setCropState(c);
      return;
    }
    const clientW = imgRef.current?.clientWidth ?? imageNaturalWidth;
    const clientH = imgRef.current?.clientHeight ?? imageNaturalHeight;
    setCropState({
      unit: '%' as const,
      x: ((c.x as number) / clientW) * 100,
      y: ((c.y as number) / clientH) * 100,
      width: ((c.width as number) / clientW) * 100,
      height: ((c.height as number) / clientH) * 100,
    });
  }, [imageNaturalWidth, imageNaturalHeight]);

  const moveCrop = useCallback((dx: number, dy: number) => {
    const current = cropRef.current;
    if (!current) return;

    const percW = current.width as number;
    const percH = current.height as number;
    const step = STEP_VALUES[stepRef.current];
    const newX = Math.max(0, Math.min((current.x as number) + dx * step, 100 - percW));
    const newY = Math.max(0, Math.min((current.y as number) + dy * step, 100 - percH));

    setCropState({
      unit: '%' as const,
      x: newX,
      y: newY,
      width: percW,
      height: percH,
    });
  }, []);

  const resetCrop = useCallback(() => {
    const newCrop: Crop = {
      unit: '%',
      x: (initialBox.x / imageNaturalWidth) * 100,
      y: (initialBox.y / imageNaturalHeight) * 100,
      width: (initialBox.width / imageNaturalWidth) * 100,
      height: (initialBox.height / imageNaturalHeight) * 100,
    };
    setCropState(newCrop);
  }, [initialBox, imageNaturalWidth, imageNaturalHeight]);

  const recenterOnFace = useCallback(() => {
    const current = cropRef.current;
    if (!current || !faceBox) return;

    const currentW = ((current.width as number) / 100) * imageNaturalWidth;
    const currentH = ((current.height as number) / 100) * imageNaturalHeight;
    const currentArea = currentW * currentH;
    const faceArea = faceBox.width * faceBox.height;
    const factor = currentArea / faceArea;

    const newBoxNatural = area2rect(faceBox, 32 / 26, factor);

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

    let finalX = Math.round((faceBox.x + faceBox.width / 2) - finalW / 2);
    let finalY = Math.round((faceBox.y + faceBox.height / 2) - finalH / 2);

    finalX = Math.max(0, Math.min(finalX, imageNaturalWidth - finalW));
    finalY = Math.max(0, Math.min(finalY, imageNaturalHeight - finalH));

    setCropState({
      unit: '%',
      x: (finalX / imageNaturalWidth) * 100,
      y: (finalY / imageNaturalHeight) * 100,
      width: (finalW / imageNaturalWidth) * 100,
      height: (finalH / imageNaturalHeight) * 100,
    });
  }, [faceBox, imageNaturalWidth, imageNaturalHeight]);

  const confirmCrop = useCallback(() => {
    const current = cropRef.current;
    if (!current) return;

    // Crop is always normalized to percentages
    const finalBox: Box = {
      x: Math.round(((current.x as number) / 100) * imageNaturalWidth),
      y: Math.round(((current.y as number) / 100) * imageNaturalHeight),
      width: Math.round(((current.width as number) / 100) * imageNaturalWidth),
      height: Math.round(((current.height as number) / 100) * imageNaturalHeight),
    };
    onCropComplete(finalBox);
  }, [imageNaturalWidth, imageNaturalHeight, onCropComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        switch (e.key) {
          case 'ArrowLeft': moveCrop(-1, 0); break;
          case 'ArrowRight': moveCrop(1, 0); break;
          case 'ArrowUp': moveCrop(0, -1); break;
          case 'ArrowDown': moveCrop(0, 1); break;
        }
        return;
      }

      switch (e.key) {
        case 'o': resetCrop(); break;
        case 'c': recenterOnFace(); break;
        case 'Enter': confirmCrop(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveCrop, resetCrop, recenterOnFace, confirmCrop]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="max-w-full overflow-hidden border border-gray-200 bg-gray-100 rounded shadow-inner">
        <ReactCrop crop={crop} onChange={normalizeToPercentage} aspect={26 / 32}>
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
          />
        </ReactCrop>
      </div>

      {/* Step selector and nudge buttons */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Step:</label>
        <select
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          defaultValue="1"
          onChange={(e) => { stepRef.current = e.target.value as keyof typeof STEP_VALUES; }}
        >
          <option value="1">×1 (0.3%)</option>
          <option value="2">×2 (0.6%)</option>
          <option value="5">×5 (1.5%)</option>
          <option value="10">×10 (3.0%)</option>
        </select>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => moveCrop(0, -1)}
          className="w-12 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 text-lg font-bold"
          aria-label="Move up"
        >
          ▲
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => moveCrop(-1, 0)}
            className="w-12 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 text-lg font-bold"
            aria-label="Move left"
          >
            ◀
          </button>
          <button
            onClick={() => moveCrop(1, 0)}
            className="w-12 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 text-lg font-bold"
            aria-label="Move right"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => moveCrop(0, 1)}
          className="w-12 h-10 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 text-lg font-bold"
          aria-label="Move down"
        >
          ▼
        </button>
      </div>

      <button
        onClick={confirmCrop}
        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
      >
        Confirm Crop & Create Template
      </button>
    </div>
  );
}