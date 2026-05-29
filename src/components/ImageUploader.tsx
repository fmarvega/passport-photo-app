import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload } from 'lucide-react';

interface Props {
  onImageSelected: (dataUrl: string) => void;
}

export function ImageUploader({ onImageSelected }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Upload your photo</CardTitle>
        <CardDescription>
          Select a portrait — face detection runs entirely in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 py-8">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[hsl(var(--muted))]">
          <Upload className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
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
      </CardContent>
    </Card>
  );
}