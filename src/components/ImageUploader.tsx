import React, { useRef } from 'react';

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
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg">Select a portrait photo to create a passport template</p>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Choose Photo
      </button>
    </div>
  );
}