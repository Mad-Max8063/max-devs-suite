import React, { useEffect } from 'react';

export interface GalleryLightboxItem {
  image_url: string;
  caption?: string;
}

interface GalleryLightboxProps {
  images: GalleryLightboxItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({ images, currentIndex, onClose, onNavigate }) => {
  const isOpen = currentIndex !== null;
  const current = isOpen ? images[currentIndex] : null;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onNavigate((currentIndex! - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') onNavigate((currentIndex! + 1) % images.length);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, images.length, isOpen, onClose, onNavigate]);

  if (!isOpen || !current) return null;

  const goPrev = () => onNavigate((currentIndex - 1 + images.length) % images.length);
  const goNext = () => onNavigate((currentIndex + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in-up"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 size-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Cerrar"
      >
        <span className="material-symbols-outlined">close</span>
      </button>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Anterior"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      )}

      <figure className="max-w-5xl w-full" onClick={(event) => event.stopPropagation()}>
        <img
          src={current.image_url}
          alt={current.caption || `Trabajo ${currentIndex + 1}`}
          className="max-h-[78vh] w-full object-contain rounded-lg shadow-2xl"
        />
        {current.caption && (
          <figcaption className="mt-4 text-center text-sm font-bold text-white">
            {current.caption}
          </figcaption>
        )}
      </figure>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Siguiente"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      )}
    </div>
  );
};

export default GalleryLightbox;
