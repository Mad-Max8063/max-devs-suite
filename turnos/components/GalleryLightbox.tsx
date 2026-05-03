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
  whatsappCatalogUrl?: string;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({ images, currentIndex, onClose, onNavigate, whatsappCatalogUrl }) => {
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
        {whatsappCatalogUrl && (
          <a
            href={whatsappCatalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-white text-sm shadow-lg transition-opacity hover:opacity-90"
            style={{ background: '#25D366' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Ver en catálogo de WhatsApp
          </a>
        )}
        {current.caption && (
          <figcaption className="mt-3 text-center text-sm font-bold text-white">
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
