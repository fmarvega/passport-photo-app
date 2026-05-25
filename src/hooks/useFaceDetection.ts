import { useEffect, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import type { Box } from '../types';
import { centeredSquare } from '../utils/geometry';

export function useFaceDetection() {
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      // Landmarks improve detection accuracy slightly (optional but recommended)
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  const detectFace = useCallback(async (image: HTMLImageElement): Promise<Box> => {
    const detection = await faceapi.detectSingleFace(
      image,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    );
    if (detection && detection.box) {
      const { x, y, width, height } = detection.box;
      return { x, y, width, height };
    }
    return centeredSquare(image.naturalWidth, image.naturalHeight);
  }, []); // Stable reference – no dependencies

  return { modelsLoaded, detectFace };
}