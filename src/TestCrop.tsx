import { useState, useEffect } from 'react';
import { FaceCropper } from './components/FaceCropper';
import { TemplatePreview } from './components/TemplatePreview';
import { generateTemplate } from './utils/canvasGenerator';
import type { Box } from './types';

export function TestCrop() {
  const [imageSrc] = useState('/test_foto.jpg');
  const [imgNaturalWidth, setImgNaturalWidth] = useState(0);
  const [imgNaturalHeight, setImgNaturalHeight] = useState(0);
  const [templateDataUrl, setTemplateDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgNaturalWidth(img.naturalWidth);
      setImgNaturalHeight(img.naturalHeight);
      console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
    };
  }, [imageSrc]);

  const initialBoxCalculated: Box = imgNaturalWidth > 0
    ? {
        x: Math.round(imgNaturalWidth * 0.3),
        y: Math.round(imgNaturalHeight * 0.3),
        width: Math.round(imgNaturalWidth * 0.4),
        height: Math.round(imgNaturalHeight * 0.4),
      }
    : { x: 0, y: 0, width: 0, height: 0 };

  const handleCropComplete = (finalBox: Box) => {
    console.log('Final crop box (natural pixels):', finalBox);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const template = generateTemplate(img, finalBox);
      console.log('Canvas: 1772 x 1181');
      setTemplateDataUrl(template);
    };
  };

  if (imgNaturalWidth === 0) {
    return <div style={{ padding: '2rem' }}>Loading image...</div>;
  }

  const handleReset = () => {
    window.location.reload();
  };

  if (imgNaturalWidth === 0) {
    return <div style={{ padding: '2rem' }}>Loading image...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Face Cropper Test</h1>
      <p>Image: {imgNaturalWidth} x {imgNaturalHeight}</p>
      <p>Initial box: {initialBoxCalculated.x}, {initialBoxCalculated.y}, {initialBoxCalculated.width} x {initialBoxCalculated.height}</p>
      <FaceCropper
        imageSrc={imageSrc}
        initialBox={initialBoxCalculated}
        faceBox={null}
        imageNaturalWidth={imgNaturalWidth}
        imageNaturalHeight={imgNaturalHeight}
        onCropComplete={handleCropComplete}
      />
      {templateDataUrl && (
        <TemplatePreview templateDataUrl={templateDataUrl} onReset={handleReset} />
      )}
    </div>
  );
}