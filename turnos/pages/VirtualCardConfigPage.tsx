import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '../utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useProfile } from '../context/AppContext';
import { Profile, uploadBusinessImage } from '../services/supabaseService';
import BottomNavigation from '../components/BottomNavigation';
import DemoBanner from '../components/DemoBanner';
import DemoSaveModal from '../components/DemoSaveModal';
import GalleryLightbox from '../components/GalleryLightbox';
import SocialIconsBar from '../components/SocialIconsBar';
import { resizeImage } from '../../shared/imageUtils';
import { downloadVCard } from '../../shared/vcard';
import { useDebounceSave } from '../hooks/useDebounceSave';

const MAX_GALLERY_IMAGES = 3;

type GalleryItem = { image_url: string; caption?: string };

type DraftProfile = Pick<
  Profile,
  'Profession' | 'Description' | 'Location' | 'Facebook' | 'Instagram' | 'Website' | 'GalleryImages'
> & {
  whatsapp_message?: string;
};

const emptyDraft: DraftProfile = {
  Profession: '',
  Description: '',
  Location: '',
  Facebook: '',
  Instagram: '',
  Website: '',
  GalleryImages: [],
  whatsapp_message: '',
};

function profileToDraft(profile: Profile | null): DraftProfile {
  if (!profile) return emptyDraft;
  return {
    Profession: profile.Profession || '',
    Description: profile.Description || '',
    Location: profile.Location || '',
    Facebook: profile.Facebook || '',
    Instagram: profile.Instagram || '',
    Website: profile.Website || '',
    GalleryImages: profile.GalleryImages || [],
    whatsapp_message: profile.whatsapp_message || '',
  };
}

const VirtualCardConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { slug: contextSlug, setSlug } = useApp();
  const { profile, loading, updateProfile } = useProfile();

  const slug = urlSlug || contextSlug || 'demo';
  const isPremium = profile?.IsPremium;
  const [draftProfile, setDraftProfile] = useState<DraftProfile>(emptyDraft);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (urlSlug && urlSlug !== contextSlug) {
      setSlug(urlSlug);
      setIsFormInitialized(false);
    }
  }, [urlSlug, contextSlug, setSlug]);

  useEffect(() => {
    if (profile && !isFormInitialized) {
      setDraftProfile(profileToDraft(profile));
      setIsFormInitialized(true);
      setIsDirty(false);
    }
  }, [profile, isFormInitialized]);

  const saveDraft = useCallback(async (data: DraftProfile) => {
    if (slug === 'demo') {
      setShowDemoModal(true);
      return;
    }

    await updateProfile({
      Profession: data.Profession,
      Description: data.Description,
      Location: data.Location,
      Facebook: data.Facebook,
      Instagram: data.Instagram,
      Website: data.Website,
      GalleryImages: data.GalleryImages,
      whatsapp_message: data.whatsapp_message,
    });
    setIsDirty(false);
  }, [slug, updateProfile]);

  const { scheduleSave, saveNow, isSaving, lastSaved } = useDebounceSave<DraftProfile>(saveDraft, 3000);

  const updateDraft = <K extends keyof DraftProfile>(key: K, value: DraftProfile[K]) => {
    const nextDraft = { ...draftProfile, [key]: value };
    setDraftProfile(nextDraft);
    setIsDirty(true);
    if (slug !== 'demo') scheduleSave(nextDraft);
  };

  const handleManualSave = async () => {
    if (slug === 'demo') {
      setShowDemoModal(true);
      return;
    }

    try {
      await saveNow(draftProfile);
    } catch (error) {
      logger.error('Error saving virtual card profile', error);
      alert('Error guardando los cambios');
    }
  };

  const uploadImageFromInput = (event: React.ChangeEvent<HTMLInputElement>, folder: 'photo' | 'cover' | 'gallery', galleryIndex?: number) => {
    if (folder !== 'gallery' && !isPremium) return;
    if (slug === 'demo') {
      setShowDemoModal(true);
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const compressed = await resizeImage(
          base64,
          folder === 'cover' ? 1200 : 800,
          folder === 'cover' ? 800 : 800,
          0.7
        );
        const publicUrl = await uploadBusinessImage(compressed, folder, slug);

        if (folder === 'cover') {
          await updateProfile({ CoverURL: publicUrl });
        } else if (folder === 'photo') {
          await updateProfile({ FotoURL: publicUrl });
        } else if (galleryIndex !== undefined) {
          const nextGallery = [...(draftProfile.GalleryImages || [])];
          nextGallery[galleryIndex] = { ...(nextGallery[galleryIndex] || {}), image_url: publicUrl, caption: nextGallery[galleryIndex]?.caption || '' };
          updateDraft('GalleryImages', nextGallery);
        }
      } catch (err) {
        logger.error('Error uploading virtual card image', err);
        alert('Error al procesar la imagen.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const gallery = useMemo(() => draftProfile.GalleryImages || [], [draftProfile.GalleryImages]);
  const currentCover = profile?.CoverURL || '';
  const currentLogo = profile?.FotoURL || '/assets/suito-symbol.png';
  const businessName = profile?.NombreNegocio || 'Tu negocio';

  const saveLabel = isSaving ? 'Guardando...' : lastSaved && !isDirty ? 'Guardado' : isDirty ? 'Sin guardar' : 'Guardado';

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      <DemoSaveModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
      <GalleryLightbox
        images={gallery.filter((item): item is GalleryItem => Boolean(item?.image_url))}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
      {slug && <DemoBanner slug={slug} />}

      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-surface/95 backdrop-blur-xl border-b border-white/10 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 -ml-2 rounded-full active:bg-white/10 transition-colors" aria-label="Volver">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-center flex-1">Identidad</h1>
        <button onClick={handleManualSave} disabled={isSaving || loading} className="flex items-center justify-end min-w-24 px-2 py-1 rounded-lg">
          <span className={`font-bold text-sm transition-colors ${lastSaved && !isDirty ? 'text-green-400' : 'text-primary'}`}>
            {saveLabel}
          </span>
        </button>
      </div>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 pb-28 lg:grid-cols-12">
        <section className="lg:col-span-7 space-y-5">
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="relative h-48 bg-surface-2">
              {currentCover ? (
                <img src={currentCover} className={`h-full w-full object-cover ${!isPremium ? 'grayscale blur-sm opacity-60' : ''}`} alt="Portada" />
              ) : (
                <div className="h-full w-full bg-[image:var(--theme-gradient)]" />
              )}
              {!isPremium && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-4 text-center">
                  <span className="material-symbols-outlined text-yellow-300 text-4xl mb-2">lock</span>
                  <p className="text-white font-bold text-sm">Desbloquea tu portada</p>
                  <p className="text-white/80 text-xs">Pasate a Premium y saca nuestra publicidad</p>
                </div>
              )}
              <label className={`absolute bottom-3 right-3 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-colors ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-black/75'}`}>
                <span className="material-symbols-outlined text-[20px]">edit</span>
                <input type="file" accept="image/*" disabled={!isPremium} onChange={(event) => uploadImageFromInput(event, 'cover')} className="hidden" />
              </label>

              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className={`relative size-24 overflow-hidden rounded-full border-4 border-surface bg-surface-2 shadow-xl ${!isPremium ? 'grayscale' : ''}`}>
                  <img src={currentLogo} className="h-full w-full object-cover" alt="Perfil" />
                </div>
                <label className={`absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-md transition-transform ${!isPremium ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'cursor-pointer hover:scale-110'}`}>
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <input type="file" accept="image/*" disabled={!isPremium} onChange={(event) => uploadImageFromInput(event, 'photo')} className="hidden" />
                </label>
              </div>
            </div>
            <div className="px-5 pb-5 pt-16 text-center">
              <h2 className="text-xl font-extrabold">{businessName}</h2>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">{draftProfile.Profession || 'Profesión / especialidad'}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <SectionTitle icon="person" title="Información pública" />
            <Field label="Profesión / título">
              <input value={draftProfile.Profession || ''} onChange={(event) => updateDraft('Profession', event.target.value)} placeholder="Ej. Barbería, Salón de Belleza" className="suito-input" />
            </Field>
            <Field label="Sobre nosotros">
              <textarea value={draftProfile.Description || ''} onChange={(event) => updateDraft('Description', event.target.value)} placeholder="Conta sobre vos y tus servicios..." rows={3} className="suito-input resize-none" />
            </Field>
            <Field label="Ubicación">
              <input value={draftProfile.Location || ''} onChange={(event) => updateDraft('Location', event.target.value)} placeholder="Calle 123, Ciudad" className="suito-input" />
            </Field>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <SectionTitle icon="link" title="Redes y contacto" />
            <Field label="Instagram">
              <input value={draftProfile.Instagram || ''} onChange={(event) => updateDraft('Instagram', event.target.value)} placeholder="suito.pro" className="suito-input" />
            </Field>
            <Field label="Facebook URL">
              <input value={draftProfile.Facebook || ''} onChange={(event) => updateDraft('Facebook', event.target.value)} placeholder="https://facebook.com/..." className="suito-input" />
            </Field>
            <Field label="Sitio web / link externo">
              <input value={draftProfile.Website || ''} onChange={(event) => updateDraft('Website', event.target.value)} placeholder="https://..." className="suito-input" />
            </Field>
            <Field label="Mensaje predefinido de WhatsApp">
              <textarea value={draftProfile.whatsapp_message || ''} onChange={(event) => updateDraft('whatsapp_message', event.target.value)} placeholder="Hola! Vi tu tarjeta y me gustaría hacer una consulta." rows={3} maxLength={240} className="suito-input resize-none" />
            </Field>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle icon="collections" title="Galería de trabajos" />
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-bold text-on-surface-variant">{gallery.length} / {MAX_GALLERY_IMAGES}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: MAX_GALLERY_IMAGES }).map((_, index) => {
                const item = gallery[index];
                return (
                  <div key={index} className="flex flex-col gap-2">
                    {item?.image_url ? (
                      <button type="button" onClick={() => setLightboxIndex(index)} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-surface-2">
                        <img src={item.image_url} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt={`Trabajo ${index + 1}`} />
                        <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">Ver</span>
                      </button>
                    ) : (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-primary/60">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant">add_photo_alternate</span>
                        <span className="mt-2 text-[10px] font-medium text-on-surface-variant">Agregar</span>
                        <input type="file" accept="image/*" onChange={(event) => uploadImageFromInput(event, 'gallery', index)} className="hidden" />
                      </label>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={!item?.image_url}
                        value={item?.caption || ''}
                        onChange={(event) => {
                          const nextGallery = [...gallery];
                          if (!nextGallery[index]) return;
                          nextGallery[index] = { ...nextGallery[index], caption: event.target.value };
                          updateDraft('GalleryImages', nextGallery);
                        }}
                        placeholder="Título..."
                        className="suito-input px-3 py-2 text-center text-xs disabled:opacity-45"
                      />
                      {item?.image_url && (
                        <button
                          type="button"
                          onClick={() => updateDraft('GalleryImages', gallery.filter((_, itemIndex) => itemIndex !== index))}
                          className="size-9 shrink-0 rounded-lg bg-red-500/90 text-white"
                          aria-label="Eliminar imagen"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="mx-auto max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] shadow-2xl animate-scale-in">
            <div className="relative h-44 bg-[image:var(--theme-gradient)]">
              {currentCover && <img src={currentCover} alt="" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
              <div className="absolute -bottom-11 left-1/2 size-24 -translate-x-1/2 overflow-hidden rounded-full border-4 border-[#121212] bg-surface-2">
                <img src={currentLogo} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="px-6 pb-7 pt-16 text-center">
              <h2 className="text-2xl font-black">{businessName}</h2>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-primary">{draftProfile.Profession || 'Tu especialidad'}</p>
              {draftProfile.Description && <p className="mx-auto mt-3 max-w-xs text-sm text-on-surface-variant">{draftProfile.Description}</p>}
              {draftProfile.Location && (
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                  {draftProfile.Location}
                </p>
              )}
              <div className="mt-4">
                <SocialIconsBar
                  phone={profile?.Telefono}
                  whatsappMessage={draftProfile.whatsapp_message}
                  instagram={draftProfile.Instagram}
                  facebook={draftProfile.Facebook}
                  website={draftProfile.Website}
                />
              </div>
              <button
                type="button"
                onClick={() => downloadVCard({
                  name: businessName,
                  profession: draftProfile.Profession,
                  description: draftProfile.Description,
                  phone: profile?.Telefono,
                  email: profile?.Email,
                  location: draftProfile.Location,
                  website: draftProfile.Website,
                  instagram: draftProfile.Instagram,
                  photo: currentLogo,
                })}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Descargar contacto
              </button>
              {gallery.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {gallery.filter((item) => item.image_url).slice(0, MAX_GALLERY_IMAGES).map((item, index) => (
                    <button key={`${item.image_url}-${index}`} type="button" onClick={() => setLightboxIndex(index)} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
                      <img src={item.image_url} alt={item.caption || `Trabajo ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {slug && <BottomNavigation slug={slug} />}
    </div>
  );
};

const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-primary">{icon}</span>
    <h3 className="font-bold text-white">{title}</h3>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="ml-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
    {children}
  </label>
);

export default VirtualCardConfigPage;
