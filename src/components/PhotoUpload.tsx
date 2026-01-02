import { useState, useCallback, useMemo } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadProps {
  photos: string; // Semicolon-separated URLs
  onChange: (photos: string) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const photoList = useMemo(() => photos ? photos.split(';').filter(p => p.trim()) : [], [photos]);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newPhotos: string[] = [];
      const remainingSlots = maxPhotos - photoList.length;

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              newPhotos.push(e.target.result as string);
              if (newPhotos.length === Math.min(files.length, remainingSlots)) {
                const allPhotos = [...photoList, ...newPhotos];
                onChange(allPhotos.join(';'));
              }
            }
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [photoList, maxPhotos, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removePhoto = (index: number) => {
    const newPhotos = photoList.filter((_, i) => i !== index);
    onChange(newPhotos.join(';'));
  };

  const addPhotoUrl = () => {
    const url = prompt('Enter photo URL:');
    if (url && url.trim()) {
      const newPhotos = [...photoList, url.trim()];
      onChange(newPhotos.join(';'));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Photos ({photoList.length}/{maxPhotos})
        </label>
        <button
          onClick={addPhotoUrl}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          disabled={photoList.length >= maxPhotos}
        >
          Add URL
        </button>
      </div>

      {photoList.length < maxPhotos && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drop images here or click to upload
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {maxPhotos - photoList.length} slots remaining
            </p>
          </label>
        </div>
      )}

      {photoList.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {photoList.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700">
                {photo.startsWith('data:') || photo.startsWith('http') ? (
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

