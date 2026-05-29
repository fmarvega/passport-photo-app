import { useState, useEffect, useCallback, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { Box } from '../types';
import { area2rect } from '../utils/geometry';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

interface FaceCropperProps {
  imageSrc: string;
  initialBox: Box;
  faceBox: Box | null;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  onCropComplete: (finalBoxNatural: Box) => void;
  onReset: () => void;
}

const STEP_VALUES = { '1': 0.3, '2': 0.6, '5': 1.5, '10': 3.0 };

export function FaceCropper({
  imageSrc,
  initialBox,
  faceBox,
  imageNaturalWidth,
  imageNaturalHeight,
  onCropComplete,
  onReset,
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

  useEffect(() => {
    cropRef.current = crop;
  }, [crop]);

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

    const finalBox: Box = {
      x: Math.round(((current.x as number) / 100) * imageNaturalWidth),
      y: Math.round(((current.y as number) / 100) * imageNaturalHeight),
      width: Math.round(((current.width as number) / 100) * imageNaturalWidth),
      height: Math.round(((current.height as number) / 100) * imageNaturalHeight),
    };
    onCropComplete(finalBox);
  }, [imageNaturalWidth, imageNaturalHeight, onCropComplete]);

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
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Adjust crop</CardTitle>
        <CardDescription>
          Drag or use the controls. Aspect ratio 26×32 is locked.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="w-full overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] flex items-center justify-center">
          <ReactCrop crop={crop} onChange={normalizeToPercentage} aspect={26 / 32}>
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[hsl(var(--foreground))] whitespace-nowrap">Step size</span>
          <Select
            defaultValue="1"
            onValueChange={(v) => { stepRef.current = v as keyof typeof STEP_VALUES; }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">×1 (0.3%)</SelectItem>
              <SelectItem value="2">×2 (0.6%)</SelectItem>
              <SelectItem value="5">×5 (1.5%)</SelectItem>
              <SelectItem value="10">×10 (3.0%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveCrop(0, -1)}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => moveCrop(-1, 0)}
              aria-label="Move left"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-10 h-10" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => moveCrop(1, 0)}
              aria-label="Move right"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveCrop(0, 1)}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
          ↑ ↓ ← → to move · O to reset · C to re-center · Enter to confirm
        </p>

        <div className="flex gap-3">
          <Button size="lg" className="flex-1 gap-2" onClick={confirmCrop}>
            <CheckCircle2 className="w-4 h-4" />
            Confirm and generate
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}