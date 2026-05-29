import { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { FaceCropper } from './components/FaceCropper';
import { TemplatePreview } from './components/TemplatePreview';
import { useFaceDetection } from './hooks/useFaceDetection';
import { generateTemplate } from './utils/canvasGenerator';
import { area2rect } from './utils/geometry';
import { Button } from './components/ui/button';
import { Sun, Moon } from 'lucide-react';
import type { Box, ProcessingStage } from './types';

const FACTOR_GUESS = 3.8;

export default function App() {
  const [stage, setStage] = useState<ProcessingStage>('upload');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
  const [imgNaturalHeight, setImgNaturalHeight] = useState(0);
  const [faceBox, setFaceBox] = useState<Box | null>(null);
  const [initialCrop, setInitialCrop] = useState<Box | null>(null);
  const [templateDataUrl, setTemplateDataUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const { modelsLoaded, detectFace } = useFaceDetection();

  useEffect(() => {
    const saved = localStorage.getItem('passport-photo-theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('passport-photo-theme', theme);
  }, [theme]);

  const reset = () => {
    setStage('upload');
    setImageSrc('');
    setFaceBox(null);
    setInitialCrop(null);
    setTemplateDataUrl('');
    setError(null);
  };

  const handleImageSelected = useCallback(
    async (src: string) => {
      setError(null);
      setDetecting(true);
      setImageSrc(src);

      const img = new Image();
      img.src = src;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          setImgNaturalWidth(img.naturalWidth);
          setImgNaturalHeight(img.naturalHeight);
          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      }).catch(() => {
        setError('Could not load the selected image. Please try another file.');
        setDetecting(false);
        return;
      });

      try {
        const box = await detectFace(img);
        setFaceBox(box);

        const cropNatural = area2rect(box, 32 / 26, FACTOR_GUESS);

        let initW = cropNatural.width;
        let initH = cropNatural.height;

        if (initW > img.naturalWidth) {
          initW = img.naturalWidth;
          initH = Math.round(initW * (32 / 26));
        }
        if (initH > img.naturalHeight) {
          initH = img.naturalHeight;
          initW = Math.round(initH * (26 / 32));
        }

        let initX = Math.round((box.x + box.width / 2) - initW / 2);
        let initY = Math.round((box.y + box.height / 2) - initH / 2);

        initX = Math.max(0, Math.min(initX, img.naturalWidth - initW));
        initY = Math.max(0, Math.min(initY, img.naturalHeight - initH));

        setInitialCrop({ x: initX, y: initY, width: initW, height: initH });
        setStage('crop');
      } catch {
        setError('Face detection failed. Please try another image.');
      }
      setDetecting(false);
    },
    [detectFace]
  );

  const handleCropConfirm = useCallback(
    (finalBoxNatural: Box) => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const dataUrl = generateTemplate(img, finalBoxNatural);
        setTemplateDataUrl(dataUrl);
        setStage('template');
      };
    },
    [imageSrc]
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] transition-colors duration-300">
      <header className="border-b border-[hsl(var(--border))]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">Passport Photo Generator</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        {error && (
          <div className="mb-4 p-4 bg-[hsl(var(--destructive))/0.1] border border-[hsl(var(--destructive))/0.2] rounded-lg">
            <p className="text-[hsl(var(--destructive))]">{error}</p>
          </div>
        )}

        {stage === 'upload' && (
          <div className="flex flex-col items-center justify-center py-12">
            {!modelsLoaded ? (
              <div className="text-center">
                <p className="text-[hsl(var(--muted-foreground))] mb-3">Loading AI components…</p>
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <ImageUploader onImageSelected={handleImageSelected} />
            )}
          </div>
        )}

        {stage === 'crop' && initialCrop && (
          <div>
            {detecting && (
              <div className="mb-4 p-3 bg-[hsl(var(--primary))/0.1] border border-[hsl(var(--primary))/0.2] rounded-lg text-center">
                <p className="text-[hsl(var(--primary))] text-sm">Detecting face…</p>
              </div>
            )}
            <FaceCropper
              imageSrc={imageSrc}
              initialBox={initialCrop}
              faceBox={faceBox}
              imageNaturalWidth={imgNaturalWidth}
              imageNaturalHeight={imgNaturalHeight}
              onCropComplete={handleCropConfirm}
            />
          </div>
        )}

        {stage === 'template' && templateDataUrl && (
          <TemplatePreview templateDataUrl={templateDataUrl} onReset={reset} />
        )}
      </main>
    </div>
  );
}