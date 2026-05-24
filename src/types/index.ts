export interface Box {
  x: number;      // top-left x (pixels, base-0, natural image dimensions)
  y: number;
  width: number;
  height: number;
}

export interface CropState {
  box: Box;                    // current crop (natural pixels, for final canvas)
  initialBox: Box;             // AI-based initial crop (natural pixels)
  faceBox: Box | null;         // raw face detection box (natural pixels)
  aspectRatio: number;         // 26/32 (width/height)
  imageNaturalWidth: number;
  imageNaturalHeight: number;
}

export type ProcessingStage = 'upload' | 'crop' | 'template';