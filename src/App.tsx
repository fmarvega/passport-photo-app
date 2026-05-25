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

  const { modelsLoaded, detectFace } = useFaceDetection();

  const handleImageSelected = useCallback(
    async (src: string) => {
      setImageSrc(src);

      const img = new Image();
      img.src = src;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          setImgNaturalWidth(img.naturalWidth);
          setImgNaturalHeight(img.naturalHeight);
          resolve();
        };
      });

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

  const reset = () => {
    setStage('upload');
    setImageSrc('');
    setFaceBox(null);
    setInitialCrop(null);
    setTemplateDataUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Passport Photo Generator</h1>

      {stage === 'upload' && (
        <div className="flex flex-col items-center justify-center">
          {!modelsLoaded ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-3">Loading AI components…</p>
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <ImageUploader onImageSelected={handleImageSelected} />
          )}
        </div>
      )}

      {stage === 'crop' && initialCrop && (
        <div className="max-w-4xl mx-auto">
          <p className="text-center mb-2 text-sm text-gray-600">
            Adjust the rectangle. Use arrow keys (hold Shift for fine tuning).
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
    </div>
  );
}