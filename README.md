# Passport Photo Generator

A fully client-side web application that generates printable passport photo templates. Upload a portrait, detect the face automatically using an in-browser AI model, adjust the crop interactively, and download a 5×3 grid template ready for printing on 15 × 10 cm photo paper at 300 DPI.

All processing happens entirely in your browser — **no images are ever uploaded to a server**.

---

## Features

- **Automatic face detection** using TinyFaceDetector and FaceLandmark68 models running locally via TensorFlow.js
- **Smart initial crop** that always respects the exact passport aspect ratio (26 mm × 32 mm = width/height 26/32)
- **Interactive crop adjustment** — drag, resize, or use keyboard shortcuts
- **Aspect ratio lock** — the crop rectangle is permanently locked to the correct passport proportions
- **Keyboard controls** — arrow keys to nudge, `O` to reset, `C` to re-center on the face, `Enter` to confirm
- **Configurable step size** — choose between ×1, ×2, ×5, or ×10 arrow-step sensitivity
- **5 × 3 grid template** — generates a 1772 × 1181 px canvas (15 cm × 10 cm @ 300 DPI) with dynamically spaced margins
- **High-quality JPEG download** — maximum quality (1.0) with no compression artifacts
- **Privacy-first** — everything runs client-side; no image data leaves your machine
- **Dark / light theme toggle** — persists your preference in `localStorage`
- **Responsive layout** — works on desktop and mobile browsers
- **Face-detection fallback** — if no face is found, a centered square covering ~1/4 of the image height is used instead

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| UI primitives | shadcn/ui (Radix-based) |
| Face detection | @vladmandic/face-api |
| Crop UI | react-image-crop |
| Icons | lucide-react |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later (ships with Node.js)

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd passport-photo-app

# Install dependencies
npm install
```

---

## Available Scripts

```bash
# Start the development server with hot module replacement
npm run dev

# Build for production (output goes to dist/)
npm run build

# Preview the production build locally
npm run preview

# Run the linter
npm run lint
```

---

## How to Use

### 1. Upload a photo

Click **Choose Photo** and select a portrait image (JPEG, PNG, etc.). The upload button only appears after the face-detection AI models have finished loading — you will see a spinner while they download.

> **Tip:** Use a well-lit frontal portrait with the face clearly visible for best detection results.

### 2. Adjust the crop

Once the face is detected, an initial crop rectangle is computed. It is always centred on the face and respects the 26:32 passport aspect ratio.

| Action | Control |
|---|---|
| Move crop | Drag the rectangle, or use **arrow keys** |
| Fine adjustment | Hold **Shift** + arrow keys |
| Reset to AI crop | Press **O** |
| Re-center on face | Press **C** (preserves current zoom area) |
| Confirm | Press **Enter** or click **Confirm Crop & Create Template** |

You can also change the **Step size** dropdown (×1 to ×10) to control how far each arrow-key press moves the crop.

### 3. Download the template

After confirming the crop, a printable template is generated. It contains a 5 × 3 grid of your cropped photo on a 15 cm × 10 cm canvas at 300 DPI.

Click **Download JPG** to save the template, or **Start Over** to try a different photo.

---

## Project Structure

```
passport-photo-app/
├── public/
│   └── models/                  # face-api model weights (TinyFaceDetector + landmarks)
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (button, card, select, etc.)
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   └── tooltip.tsx
│   │   ├── FaceCropper.tsx      # Interactive crop UI with keyboard controls
│   │   ├── ImageUploader.tsx    # File picker and upload entry point
│   │   └── TemplatePreview.tsx  # Template display and download button
│   ├── hooks/
│   │   └── useFaceDetection.ts  # Model loading + stable detectFace callback
│   ├── types/
│   │   └── index.ts             # Box, CropState, ProcessingStage types
│   ├── utils/
│   │   ├── canvasGenerator.ts   # 5×3 grid template rendering (Canvas 2D)
│   │   ├── geometry.ts          # area2rect, centeredSquare (coordinate math)
│   │   └── imageUtils.ts        # Helper utilities
│   ├── lib/
│   │   └── utils.ts             # cn() utility (clsx + tailwind-merge)
│   ├── App.tsx                  # Root component — orchestrates the full flow
│   ├── index.css                # Tailwind v4 entry + CSS custom properties
│   └── main.tsx                 # React entry point
├── index.html
├── vite.config.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── components.json              # shadcn/ui configuration
└── package.json
```

---

## How It Works

### Face detection

1. On mount, the app loads **TinyFaceDetector** and **FaceLandmark68** model weights from `public/models/` using `@vladmandic/face-api`.
2. When an image is uploaded, `detectFace()` runs the model against the image and returns the face bounding box in image-native pixels.
3. If no face is detected, a **centred square** covering roughly 1/4 of the image height is used as a fallback, fixing an axis-swap bug present in the original MATLAB code.

### Crop calculation

The `area2rect()` function in `src/utils/geometry.ts` transforms the face bounding box into a new rectangle with:
- The exact passport aspect ratio (width/height = 26/32)
- A configurable area scale factor (default 3.8× the face area)
- The rectangle is always centred on the original face box

The initial crop and the `C` key re-centre both **clamp** the result to the image boundaries, preventing overflow on extreme close-ups.

### Template generation

The `generateTemplate()` function in `src/utils/canvasGenerator.ts`:
1. Creates a 1772 × 1181 px white canvas (15 cm × 10 cm @ 300 DPI)
2. Extracts the cropped region from the original image at full resolution
3. Draws each cell at 307 × 378 px (2.6 cm × 3.2 cm @ 300 DPI)
4. Arranges them in a 5 × 3 grid with dynamically calculated symmetric margins
5. Returns a JPEG data URL at maximum quality

---

## Privacy

This application runs **entirely in your browser**. Face detection uses TensorFlow.js with WebGL acceleration — the computation happens on your GPU, and no data is sent to any server. You can disconnect from the internet after the page loads and the app will continue to work.

---

## Development Notes

### Tailwind CSS v4

This project uses **Tailwind CSS v4** with the `@tailwindcss/vite` plugin. Key differences from v3:

- Theme configuration uses CSS `@theme` directives, not `tailwind.config.js` (the config file is kept for reference but ignored at build time)
- Colour utilities use **arbitrary values** (e.g., `bg-[hsl(var(--background))]`) instead of named theme colours like `bg-background`
- The `@tailwindcss/vite` plugin is required for proper source-file scanning under Vite 8

### Face-api model weights

The model files in `public/models/` are from the [vladmandic/face-api](https://github.com/vladmandic/face-api) repository. The app uses TinyFaceDetector for performance and FaceLandmark68 for improved detection accuracy.

---

## Roadmap / Possible Improvements

- [ ] Make area scale factor user-adjustable via a slider
- [ ] Add support for different passport standards (US, UK, EU, etc.)
- [ ] Allow exporting as PNG in addition to JPEG
- [ ] Add a brightness / contrast adjustment before template generation
- [ ] Support batch processing multiple photos
- [ ] Add PWA support for offline use

---

## License

MIT
