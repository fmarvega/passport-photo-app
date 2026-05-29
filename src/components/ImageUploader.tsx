import React, { useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload } from 'lucide-react';

interface Props {
  onImageSelected: (dataUrl: string) => void;
  loading?: boolean;
}

export function ImageUploader({ onImageSelected, loading }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  return (
    <Card
      className={`w-full transition-all duration-200 ${dragging ? 'ring-2 ring-primary scale-[1.02]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="text-center">
        <CardTitle>Upload your photo</CardTitle>
        <CardDescription>
          {loading
            ? 'Processing image…'
            : dragging
              ? 'Drop your photo here'
              : 'Drop a photo or click to browse — face detection runs entirely in your browser.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 py-8 border-2 border-dashed rounded-lg mx-6 mb-6 border-transparent">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Detecting face & preparing crop…</p>
          </div>
        ) : (
          <>
            <div className={`flex items-center justify-center w-20 h-20 rounded-full transition-colors duration-200 ${dragging ? 'bg-primary/10' : 'bg-[hsl(var(--muted))]'}`}>
              <Upload className={`w-8 h-8 transition-colors duration-200 ${dragging ? 'text-primary' : 'text-[hsl(var(--muted-foreground))]'}`} />
            </div>
            <Button size="lg" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Choose Photo
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleChange}
              className="hidden"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}