import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useProfile } from '../context/AppContext';
import { uploadBusinessImage } from '../services/supabaseService';
import BottomNavigation from '../components/BottomNavigation';
import DemoBanner from '../components/DemoBanner';
import DemoSaveModal from '../components/DemoSaveModal';

// Resize helper
const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
};

const MAX_GALLERY_IMAGES = 4;

const VirtualCardConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { slug: contextSlug, setSlug } = useApp();
  const { profile, loading, updateProfile } = useProfile();

  const slug = urlSlug || contextSlug || 'demo';

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Form Fields
  const [profession, setProfession] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  
  // Gallery
  const [galleryInfos, setGalleryInfos] = useState<{image_url: string, caption?: string}[]>([]);

  useEffect(() => {
    if (urlSlug && urlSlug !== contextSlug) {
      setSlug(urlSlug);
      setIsFormInitialized(false);
    }
  }, [urlSlug, contextSlug, setSlug]);

  useEffect(() => {
    if (profile && !isFormInitialized) {
      setProfession(profile.Profession || '');
      setDescription(profile.Description || '');
      setLocation(profile.Location || '');
      setFacebook(profile.Facebook || '');
      setInstagram(profile.Instagram || '');
      setWebsite(profile.Website || '');
      setGalleryInfos(profile.GalleryImages || []);
      setIsFormInitialized(true);
    }
  }, [profile, isFormInitialized]);

  const isPremium = profile?.IsPremium;

  const handleSave = async () => {
    if (slug === 'demo') {
      setShowDemoModal(true);
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      await updateProfile({
        Profession: profession,
        Description: description,
        Location: location,
        Facebook: facebook,
        Instagram: instagram,
        Website: website,
        GalleryImages: galleryInfos,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Error guardando los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isCover = false) => {
    if (!isPremium) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const compressed = await resizeImage(base64, isCover ? 1200 : 400, isCover ? 800 : 400, 0.7);
          const folder = isCover ? 'cover' : 'photo';
          const publicUrl = await uploadBusinessImage(compressed, folder, slug);
          if (isCover) {
            await updateProfile({ CoverURL: publicUrl });
          } else {
            await updateProfile({ FotoURL: publicUrl });
          }
          alert('¡Imagen guardada!');
        } catch (err) {
          logger.error('Error uploading photo', err);
          alert('Error al procesar la imagen.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const compressed = await resizeImage(base64, 800, 800, 0.7);
          const publicUrl = await uploadBusinessImage(compressed, 'gallery', slug);
          const newGallery = [...galleryInfos];
          if (newGallery[index]) {
            newGallery[index].image_url = publicUrl;
          } else {
            newGallery[index] = { image_url: publicUrl, caption: '' };
          }
          setGalleryInfos(newGallery);
        } catch (err) {
          logger.error('Error uploading gallery', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentCover = profile?.CoverURL || "https://images.unsplash.com/photo-1595000000000-111111111111?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MzQzMTR8MHwxfGFsbHwxfHx8fHx8fHwxNzExMDMyNzQ4fA&ixlib=rb-4.0.3&q=80&w=1080";
  const currentLogo = profile?.FotoURL || "https://picsum.photos/seed/barber/200/200";

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      <DemoSaveModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
      {slug && <DemoBanner slug={slug} />}

      {/* Top App Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-200">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-center flex-1">Identidad (Tarjeta)</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center justify-end px-2 py-1 rounded-lg">
          <span className={`font-bold text-base transition-colors ${saved ? 'text-green-500' : 'text-primary hover:text-primary/80'}`}>
            {saving ? '...' : saved ? '¡Guardado!' : 'Guardar'}
          </span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        
        {/* Visual Identity Section */}
        <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <img src={currentCover} className={`w-full h-full object-cover transition-all ${!isPremium ? 'grayscale blur-sm opacity-50' : ''}`} alt="Portada" />
          
          {/* Cover Overlay Info */}
          {!isPremium && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4">
              <span className="material-symbols-outlined text-yellow-400 text-4xl mb-2">lock</span>
              <p className="text-white font-bold text-sm text-center">Desbloqueá tu portada</p>
              <p className="text-white/80 text-xs text-center">Pasate a Premium y sacá nuestra publicidad</p>
            </div>
          )}
          
          {/* Cover Input */}
          <label className={`absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 cursor-pointer transition-colors backdrop-blur-sm ${!isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}>
             <span className="material-symbols-outlined text-[20px]">edit</span>
             <input type="file" accept="image/*" disabled={!isPremium} onChange={(e) => handlePhotoUpload(e, true)} className="hidden" />
          </label>

          {/* Profile Photo over Cover */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className={`relative w-24 h-24 rounded-full overflow-hidden border-4 border-surface-light dark:border-surface-dark bg-gray-100 shadow-xl ${!isPremium ? 'grayscale' : ''}`}>
              <img src={currentLogo} className="w-full h-full object-cover" alt="Perfil" />
              {!isPremium && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                   <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">lock</span>
                 </div>
              )}
            </div>
            {/* Camera Icon Badge */}
            <label className={`absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 border-2 border-surface-light dark:border-surface-dark shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${!isPremium ? 'opacity-50 cursor-not-allowed bg-gray-500' : ''}`}>
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <input type="file" accept="image/*" disabled={!isPremium} onChange={(e) => handlePhotoUpload(e, false)} className="hidden" />
            </label>
          </div>
        </div>

        {/* Form Space After Overlay */}
        <div className="mt-16 px-4 space-y-6 max-w-lg mx-auto">
          
          {/* Basic Info */}
          <div className="flex flex-col gap-4 p-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">person</span>
                <h3 className="font-bold text-gray-900 dark:text-white">Información Pública</h3>
             </div>
             
             {/* Profession */}
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Profesión / Título</label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="Ej. Barbería, Salón de Belleza"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
             </div>

             {/* Description */}
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Sobre Nosotros</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contanos sobre vos y tus servicios..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
             </div>

             {/* Location */}
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Ubicación (Maps)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Calle 123, Ciudad"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
             </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4 p-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary">link</span>
                <h3 className="font-bold text-gray-900 dark:text-white">Redes y Contacto</h3>
             </div>

             {/* Instagram */}
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Instagram (@usuario)</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="suito.pro"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
             </div>

             {/* Facebook */}
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Facebook URL</label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
             </div>

             {/* Website */}
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Sitio Web / Link Externo</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
             </div>
          </div>

          {/* Gallery - Free Tier Enabled */}
          <div className="flex flex-col gap-4 p-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">collections</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">Galería de Trabajos</h3>
               </div>
               <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-md">
                 {galleryInfos.length} / {MAX_GALLERY_IMAGES}
               </span>
             </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 -mt-2">
               Subí hasta 4 fotos para mostrar tu mejor trabajo en la tarjeta virtual. Gratis para todos los planes.
             </p>

             <div className="grid grid-cols-2 gap-4">
                {[...Array(MAX_GALLERY_IMAGES)].map((_, index) => {
                  const info = galleryInfos[index];
                  return (
                    <div key={index} className="flex flex-col gap-2">
                       {info?.image_url ? (
                         <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                           <img src={info.image_url} className="w-full h-full object-cover" alt={`Trabajo ${index+1}`} />
                           <button 
                             onClick={() => {
                               const newG = [...galleryInfos];
                               newG.splice(index, 1);
                               setGalleryInfos(newG);
                             }}
                             className="absolute top-2 right-2 size-8 flex justify-center items-center bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                           >
                             <span className="material-symbols-outlined text-sm">delete</span>
                           </button>
                         </div>
                       ) : (
                         <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-gray-50 dark:bg-gray-800/50">
                           <span className="material-symbols-outlined text-gray-400 text-2xl">add_photo_alternate</span>
                           <span className="text-[10px] text-gray-500 mt-2 font-medium">Agregar</span>
                           <input type="file" accept="image/*" onChange={(e) => handleGalleryUpload(e, index)} className="hidden" />
                         </label>
                       )}
                       
                       {/* Caption Input */}
                       <input 
                         type="text" 
                         disabled={!info?.image_url}
                         value={info?.caption || ''}
                         onChange={(e) => {
                           if (!info) return;
                           const newG = [...galleryInfos];
                           newG[index].caption = e.target.value;
                           setGalleryInfos(newG);
                         }}
                         placeholder="Título..."
                         className="text-xs px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-primary text-center disabled:opacity-50"
                       />
                    </div>
                  );
                })}
             </div>
          </div>

        </div>
      </main>

      {slug && <BottomNavigation slug={slug} />}
    </div>
  );
};

export default VirtualCardConfigPage;
