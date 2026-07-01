import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  isOpen: boolean;
  photos: string[];
  currentIndex: number;
  onClose: () => void;
  onChangeIndex: (idx: number) => void;
}

export function ImageLightbox({
  isOpen,
  photos,
  currentIndex,
  onClose,
  onChangeIndex,
}: LightboxProps) {
  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
      onChangeIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      onChangeIndex(currentIndex + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-neutral-800/80 p-2 text-white hover:bg-neutral-700 transition"
        aria-label="Close preview"
      >
        <X className="size-5" />
      </button>

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-4 rounded-full bg-neutral-800/80 p-2.5 text-white hover:bg-neutral-700 transition"
          aria-label="Previous image"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      <div
        className="max-h-[85vh] max-w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto}
          alt="Preview"
          className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
      </div>

      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 rounded-full bg-neutral-800/80 p-2.5 text-white hover:bg-neutral-700 transition"
          aria-label="Next image"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-neutral-800/80 px-3.5 py-1 text-xs text-white">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
