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

  const moveCrop = useCallback((dx: number, dy: number) => {
    const current = cropRef.current;
    if (!current) return;

    const step = STEP_VALUES[stepRef.current];
    const newCrop: Crop = {
      unit: '%',
      x: Math.max(0, Math.min((current.x as number) + dx * step, 100 - (current.width as number))),
      y: Math.max(0, Math.min((current.y as number) + dy * step, 100 - (current.height as number))),
      width: current.width,
      height: current.height,
    };
    setCropState(newCrop);
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

    let finalX: number, finalY: number, finalW: number, finalH: number;

    if ((current.unit as string) === '%' || current.unit === undefined) {
      finalX = Math.round(((current.x as number) / 100) * imageNaturalWidth);
      finalY = Math.round(((current.y as number) / 100) * imageNaturalHeight);
      finalW = Math.round(((current.width as number) / 100) * imageNaturalWidth);
      finalH = Math.round(((current.height as number) / 100) * imageNaturalHeight);
    } else {
      const clientW = imgRef.current?.clientWidth ?? imageNaturalWidth;
      const clientH = imgRef.current?.clientHeight ?? imageNaturalHeight;
      finalX = Math.round(((current.x as number) / clientW) * imageNaturalWidth);
      finalY = Math.round(((current.y as number) / clientH) * imageNaturalHeight);
      finalW = Math.round(((current.width as number) / clientW) * imageNaturalWidth);
      finalH = Math.round(((current.height as number) / clientH) * imageNaturalHeight);
    }

    onCropComplete({ x: finalX, y: finalY, width: finalW, height: finalH });
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
        <ReactCrop crop={crop} onChange={(c) => setCropState(c)} aspect={26 / 32}>
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            style={{ maxHeight: '65vh', maxWidth: '100%', objectFit: 'contain' }}
          />
        </ReactCrop>
      </div>

      {/* Step selector and nudge buttons */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Step:</label>
        <select
          className="px-2 py-1 border border-gray-300 rounded"
          defaultValue="1"
          onChange={(e) => { stepRef.current = e.target.value as keyof typeof STEP_VALUES; }}
        >
          <option value="1">×1</option>
          <option value="2">×2</option>
          <option value="5">×5</option>
          <option value="10">×10</option>
        </select>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => moveCrop(0, -1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ▲
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => moveCrop(-1, 0)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ◀
          </button>
          <button
            onClick={() => moveCrop(1, 0)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => moveCrop(0, 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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