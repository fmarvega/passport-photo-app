import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { FaceCropper } from './components/FaceCropper';
import { TemplatePreview } from './components/TemplatePreview';
import { useFaceDetection } from './hooks/useFaceDetection';
import { generateTemplate } from './utils/canvasGenerator';
import { area2rect } from './utils/geometry';
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

  const { modelsLoaded, detectFace } = useFaceDetection();

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
            Passport Photo Generator
          </h1>
          <p className="text-gray-600 text-center mt-2 text-sm sm:text-base">
            Upload a portrait, adjust the crop to the correct 26:32 ratio, and download a printable template with 5×3 photos.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {stage === 'upload' && (
          <div className="flex flex-col items-center justify-center py-12">
            {!modelsLoaded ? (
              <div className="text-center">
                <p className="text-gray-600 mb-3">Loading AI components…</p>
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : (
              <ImageUploader onImageSelected={handleImageSelected} />
            )}
          </div>
        )}

        {stage === 'crop' && initialCrop && (
          <div>
            {detecting && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-blue-700 text-sm">Detecting face…</p>
              </div>
            )}
            <p className="text-center mb-3 text-sm text-gray-600 px-2">
              Adjust the crop rectangle. Use arrow keys or the nudge buttons below.
              Press 'O' to reset, 'C' to re-center on face, Enter or the button to confirm.
            </p>
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