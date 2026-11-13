'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImageUploaderProps {
  onImageSelected: (url: string, fileInfo: { name: string; size: number; type: string }) => void;
  onImageRemoved: () => void;
  currentImageUrl?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  onImageRemoved,
  currentImageUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a JPG, PNG, or WebP image file.');
      return;
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }

      onImageSelected(data.url, {
        name: data.fileName || file.name,
        size: data.fileSize || file.size,
        type: data.fileType || file.type,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Post Creative (1 Image)
        </label>
        <span className="text-[11px] text-zinc-400">Max 10MB • JPG or PNG</span>
      </div>

      {currentImageUrl ? (
        <div className="relative rounded-xl border border-border overflow-hidden bg-surface-card group">
          <div className="relative w-full aspect-video max-h-72 bg-black flex items-center justify-center">
            <img
              src={currentImageUrl}
              alt="Uploaded creative"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-3 bg-surface/90 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Check className="w-4 h-4" />
              <span>Image loaded & verified</span>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              leftIcon={<X className="w-3.5 h-3.5" />}
              onClick={onImageRemoved}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-gold-400 bg-gold-400/5'
              : 'border-border hover:border-gold-400/50 bg-surface-card hover:bg-surface-hover'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="w-12 h-12 rounded-full bg-gold-400/10 text-gold-400 flex items-center justify-center mb-3">
            {isUploading ? (
              <Upload className="w-6 h-6 animate-pulse" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
          </div>

          <p className="text-sm font-semibold text-white mb-1">
            {isUploading ? 'Uploading and optimizing...' : 'Click or drag & drop image'}
          </p>
          <p className="text-xs text-zinc-400 max-w-xs mb-3">
            Supports Instagram 1:1 square, 4:5 vertical, or landscape 1.91:1 formats.
          </p>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
            Browse File
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
