import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useProfile, useServices } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import DemoBanner from '../components/DemoBanner';
import DemoSaveModal from '../components/DemoSaveModal';
import SharePaymentModal from '../components/SharePaymentModal';
import ServiceManager from '../components/ServiceManager';
import { COLOR_FAMILIES, COLOR_PRESETS, DEFAULT_PRIMARY, applyThemeColor } from '../hooks/useTheme';
import { uploadBusinessImage } from '../services/sheetsService';
import { resolveAccessPriority } from '../utils/access-resolver';

/**
 * Utility to resize and compress images before uploading to Supabase Storage.
 */
const resizeImage = (base64Str: string, maxWidth = 400, maxHeight = 400, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
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
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      logger.debug(`[Resize] Final size: ${dataUrl.length} chars`);
      resolve(dataUrl);
    };
  });
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
};

const BusinessConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { slug: contextSlug, setSlug } = useApp();
  const { profile, loading, updateProfile } = useProfile();
  const { logout, user, isAuthenticated } = useAuth();
  const { services, selectedCategoryId, setServices, setSelectedCategoryId, saveServicesToBackend } = useServices();

  // Use URL slug or context slug (for demo routes)
  const slug = urlSlug || contextSlug || 'demo';

  // Local form state
  const [businessName, setBusinessName] = useState('');
  const [alias, setAlias] = useState('');
  const [linkPago, setLinkPago] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [deposit, setDeposit] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [notificacionesEmail, setNotificacionesEmail] = useState(true);
  const [recordatoriosActivos, setRecordatoriosActivos] = useState(true);
  // Flag to prevent re-initializing form state when profile updates (e.g., after photo upload)
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [colorPrimario, setColorPrimario] = useState(DEFAULT_PRIMARY);
  const [customColorInput, setCustomColorInput] = useState('');

  const activeModules = profile?.ActiveModules || ['card'];
  const hasAppointments = activeModules.includes('appointments');
  const isPremium = resolveAccessPriority(profile);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sync slug from URL and reset form initialization when slug changes
  useEffect(() => {
    if (urlSlug && urlSlug !== contextSlug) {
      setSlug(urlSlug);
      setIsFormInitialized(false); // Reset so form reloads for new profile
    }
  }, [urlSlug, contextSlug, setSlug]);

  // Initialize form state from profile ONLY ONCE when profile first loads
  // This prevents photo uploads or other partial updates from resetting the form
  useEffect(() => {
    if (profile && !isFormInitialized) {
      logger.debug('[Config] Initializing form with profile data:', profile);
      setBusinessName(profile.NombreNegocio || '');
      setAlias(profile.AliasMP || '');
      setLinkPago(profile.LinkPago || '');
      setQrImageUrl(profile.QrImageUrl || '');
      setDeposit(String(profile.ValorSena || ''));
      setPhone(profile.Telefono || '');
      setNotificacionesEmail(profile.NotificacionesEmail !== false);
      setRecordatoriosActivos(profile.RecordatoriosActivos !== false);
      const profileColor = profile.ColorPrimario || DEFAULT_PRIMARY;
      setColorPrimario(profileColor);
      setCustomColorInput(COLOR_PRESETS.some(p => p.hex === profileColor) ? '' : profileColor);
      setIsFormInitialized(true);
    }
  }, [profile, isFormInitialized]);

  // Debug logs
  useEffect(() => {
    logger.debug('[Config] Current Slug:', slug);
    logger.debug('[Config] Profile:', profile);
    logger.debug('[Config] Profile Loading:', loading);
  }, [slug, profile, loading]);

  const uploadResizedBusinessImage = async (
    file: File,
    folder: 'photo' | 'qr',
    maxWidth: number,
    maxHeight: number,
    quality: number
  ) => {
    const base64 = await readFileAsDataUrl(file);
    logger.debug(`[${folder}Upload] Base64 length before resize:`, base64.length);
    const compressed = await resizeImage(base64, maxWidth, maxHeight, quality);
    logger.debug(`[${folder}Upload] Compressed length:`, compressed.length);
    return uploadBusinessImage(compressed, folder, slug);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (slug === 'demo') {
      setShowDemoModal(true);
      e.target.value = '';
      return;
    }

    setPhotoUploading(true);
    try {
      const publicUrl = await uploadResizedBusinessImage(file, 'photo', 250, 250, 0.7);
      logger.debug('[PhotoUpload] Calling updateProfile with public URL...');
      await updateProfile({ FotoURL: publicUrl });
    } catch (err) {
      logger.error('[PhotoUpload] Error:', err);
      alert('Error al procesar o subir la imagen: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (slug === 'demo') {
      setShowDemoModal(true);
      e.target.value = '';
      return;
    }

    setQrUploading(true);
    try {
      const publicUrl = await uploadResizedBusinessImage(file, 'qr', 500, 500, 0.7);
      setQrImageUrl(publicUrl);
    } catch (err) {
      logger.error('[QR Upload] Error:', err);
      alert('Error al procesar o subir el QR: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setQrUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      await updateProfile({
        NombreNegocio: businessName,
        AliasMP: alias,
        LinkPago: linkPago,
        QrImageUrl: qrImageUrl,
        ValorSena: parseInt(deposit) || 0,
        Telefono: phone,
        NotificacionesEmail: notificacionesEmail,
        RecordatoriosActivos: recordatoriosActivos,
        ColorPrimario: colorPrimario,
      });
      // Save services alongside profile
      await saveServicesToBackend(services, selectedCategoryId);
      setSaved(true);
      if (slug === 'demo') {
        setShowDemoModal(true);
      }
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Error guardando los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-sans relative overflow-hidden">
      {/* Mesh Background Decorative */}
      <div className="fixed inset-0 mesh-gradient-bg opacity-[0.06] -z-10" />

      {/* Demo Modal */}
      <DemoSaveModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />

      {/* Share Payment Modal */}
      <SharePaymentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        aliasMP={alias || profile?.AliasMP || ''}
        linkPago={linkPago || profile?.LinkPago}
        qrImageUrl={qrImageUrl || profile?.QrImageUrl}
        valorSena={parseInt(deposit) || profile?.ValorSena || 0}
        nombreNegocio={businessName || profile?.NombreNegocio || ''}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-500 text-3xl">logout</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">¿Cerrar sesión?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Tendrás que volver a ingresar tus credenciales para acceder a tu cuenta.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Banner */}
      {slug && <DemoBanner slug={slug} />}

      {/* Top App Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 bg-background-light/80 dark:bg-background-dark/60 backdrop-blur-xl border-b border-gray-200/70 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:scale-105 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-black tracking-tighter text-center flex-1">Configuración</h1>
        <button onClick={handleSave} disabled={saving || photoUploading || qrUploading} className="flex items-center justify-end px-2 py-1">
          <span className={`font-black text-base transition-all ${saved ? 'text-green-500' : 'text-primary hover:scale-105'}`}>
            {saving ? '...' : saved ? '¡OK!' : photoUploading || qrUploading ? 'Subiendo...' : 'Guardar'}
          </span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">

        {/* Logo Uploader Section */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative group">
            <label className="cursor-pointer">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-surface-dark shadow-lg bg-gray-200 dark:bg-gray-700">
                <img
                  src={profile?.FotoURL || "https://picsum.photos/seed/barber/200/200"}
                  alt="Logo actual"
                  className={`w-full h-full object-cover transition-opacity ${photoUploading ? 'opacity-40' : 'group-hover:opacity-90'}`}
                />
                {photoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
                  </div>
                )}
              </div>
              {/* Camera Icon Badge */}
              <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full p-2.5 border-[3px] border-background-light dark:border-background-dark shadow-md flex items-center justify-center transition-transform transform group-hover:scale-110 active:scale-95">
                <span className="material-symbols-outlined text-[20px]">{photoUploading ? 'hourglass_top' : 'photo_camera'}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={photoUploading || loading}
                className="hidden"
              />
            </label>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cambiar logo del negocio</p>
        </div>

        {/* Form Section */}
        <div className="px-4 space-y-6 max-w-lg mx-auto">

          {/* Business Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
              Nombre del Negocio
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
              </div>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-primary transition-all duration-200 shadow-inner outline-none"
                placeholder="Ej. Barbería Styles"
                disabled={loading}
              />
            </div>
          </div>

          {/* Brand Color Picker */}
          <div className="relative flex flex-col gap-3 p-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h3 className="font-bold text-gray-900 dark:text-white">Color del Negocio</h3>
              {!isPremium && <span className="ml-auto text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">Premium</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
              Elegí un color que represente tu marca. Se aplica a toda la app.
            </p>

            {/* Preset Swatches */}
            <div className={`space-y-4 ${!isPremium ? 'opacity-40 pointer-events-none select-none' : ''}`}>
              {COLOR_FAMILIES.map((family) => {
                const presets = COLOR_PRESETS.filter((preset) => preset.family === family);
                return (
                  <div key={family} className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{family}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          title={preset.label}
                          disabled={!isPremium}
                          onClick={() => {
                            setColorPrimario(preset.hex);
                            setCustomColorInput('');
                            applyThemeColor(preset.hex);
                          }}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200 ${colorPrimario.toLowerCase() === preset.hex.toLowerCase()
                              ? 'border-gray-900 dark:border-white scale-105 shadow-md'
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <div
                            className="size-10 rounded-full shadow-inner ring-2 ring-white dark:ring-gray-800 transition-transform"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="max-w-full text-center text-[10px] font-medium leading-tight text-gray-600 dark:text-gray-400">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className={`flex items-center gap-3 mt-1 ${!isPremium ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="relative">
                <input
                  type="color"
                  value={colorPrimario}
                  disabled={!isPremium}
                  onChange={(e) => {
                    setColorPrimario(e.target.value);
                    setCustomColorInput(e.target.value);
                    applyThemeColor(e.target.value);
                  }}
                  className="size-10 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-700"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={customColorInput}
                  disabled={!isPremium}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomColorInput(val);
                    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                      setColorPrimario(val);
                      applyThemeColor(val);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="#hex custom, ej: #FF6B35"
                />
              </div>
            </div>

            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-[1px]">
                <div className="flex flex-col items-center text-center p-4">
                  <span className="material-symbols-outlined text-yellow-300 text-3xl mb-1">lock</span>
                  <p className="text-white font-bold text-sm">Personaliza tus colores con Premium</p>
                </div>
              </div>
            )}
          </div>

          {/* Phone Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
              Teléfono / WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPhone(val);
                }}
                className="w-full pl-11 pr-4 py-3.5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-sm"
                placeholder="5491112345678"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">Sin espacios ni guiones. Ej: 5491112345678</p>
          </div>

          {/* Services Section */}
          {hasAppointments && (
            <div className="flex flex-col gap-2 p-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary">content_cut</span>
                <h3 className="font-bold text-gray-900 dark:text-white">Mis Servicios</h3>
              </div>
              <ServiceManager
                services={services}
                selectedCategoryId={selectedCategoryId}
                onServicesChange={setServices}
                onCategoryChange={setSelectedCategoryId}
              />
            </div>
          )}

          {/* Mercado Pago Payment Config */}
          <div className="flex flex-col gap-4 p-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary">payments</span>
              <h3 className="font-bold text-gray-900 dark:text-white">Datos de Cobro</h3>
            </div>

            {/* Alias MP */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Alias Mercado Pago
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="mi.negocio.mp"
                />
              </div>
            </div>

            {/* Link de Pago */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Link de Pago (Opcional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={linkPago}
                  onChange={(e) => setLinkPago(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="https://link-de-pago.com/tu-link"
                />
              </div>
              <p className="text-[10px] text-gray-400 ml-1 leading-tight">
                Si pegas un link aquí, el botón de pago llevará directamente a ese link.
              </p>
            </div>

            {/* QR Image Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                QR de Pago (Opcional)
              </label>
              <div className="flex items-center gap-4">
                {qrImageUrl ? (
                  <div className="relative">
                    <img
                      src={qrImageUrl}
                      alt="QR de pago"
                      className={`size-20 rounded-lg border border-gray-200 dark:border-gray-700 object-cover ${qrUploading ? 'opacity-40' : ''}`}
                    />
                    {qrUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                        <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
                      </div>
                    )}
                    <button
                      onClick={() => setQrImageUrl('')}
                      disabled={qrUploading}
                      className="absolute -top-2 -right-2 size-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center size-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-colors ${qrUploading ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-primary/50'}`}>
                    <span className={`material-symbols-outlined text-gray-400 text-xl ${qrUploading ? 'animate-spin' : ''}`}>
                      {qrUploading ? 'progress_activity' : 'qr_code_2'}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1">{qrUploading ? 'Subiendo' : 'Subir QR'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      disabled={qrUploading}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-[10px] text-gray-400 flex-1">
                  Sube una imagen de tu QR para mostrarlo a tus clientes.
                </p>
              </div>
            </div>
          </div>

          {/* Deposit Price Input - HIGHLIGHTED */}
          {hasAppointments && (
            <div className="flex flex-col gap-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
                <label className="text-sm font-bold text-primary dark:text-primary-dark">
                  Valor de la Seña (Editable)
                </label>
              </div>
              <p className="text-xs text-text-secondary-light dark:text-gray-400 mb-2">
                Actualiza este valor cuando quieras. Los nuevos clientes verán este precio inmediatamente.
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full pl-11 pr-16 py-3.5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-sm"
                  placeholder="0"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-sm font-bold text-gray-500">ARS</span>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Configuration Link */}
          {hasAppointments && (
            <div className="flex flex-col gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">calendar_month</span>
                <label className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  Días y Horarios de Atención
                </label>
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mb-2">
                Configura qué días y horarios estás disponible para recibir turnos.
              </p>
              <button
                onClick={() => navigate(`/${slug}/schedule`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                Configurar Horarios
              </button>
            </div>
          )}

          {/* Notifications Section */}
          {hasAppointments && (
            <div className="flex flex-col gap-4 p-5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary">notifications</span>
                <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones</h3>
              </div>

              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Notificaciones por email</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recibí un email cuando hay un nuevo turno</p>
                </div>
                <button
                  onClick={() => setNotificacionesEmail(!notificacionesEmail)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${notificacionesEmail ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${notificacionesEmail ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Reminders Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Recordatorios automáticos</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enviar recordatorio a clientes 1 día antes</p>
                </div>
                <button
                  onClick={() => setRecordatoriosActivos(!recordatoriosActivos)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${recordatoriosActivos ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${recordatoriosActivos ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Share Payment Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-500/20 transition-all transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[22px]">share</span>
            Compartir Datos de Pago
          </button>

          {/* Save Action */}
          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={saving || loading || photoUploading || qrUploading}
              className="w-full bg-primary hover:bg-primary/90 active:bg-primary/95 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">{saved ? 'check_circle' : 'save'}</span>
              {saving ? 'Guardando...' : photoUploading || qrUploading ? 'Subiendo imagen...' : saved ? '¡Cambios Guardados!' : 'Guardar Cambios'}
            </button>
          </div>

          {/* Account Section - Only show for authenticated users (not demo) */}
          {isAuthenticated && slug !== 'demo' && (
            <div className="pt-4 pb-8">
              <div className="flex flex-col gap-4 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-red-500">account_circle</span>
                  <h3 className="font-bold text-gray-900 dark:text-white">Cuenta</h3>
                </div>

                {/* User info */}
                {user && (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">/{user.slug}</p>
                    </div>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Bottom Navigation */}
      {slug && <BottomNavigation slug={slug} />}
    </div>
  );
};

export default BusinessConfigPage;
