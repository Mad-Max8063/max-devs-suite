import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_CATEGORIES } from '../constants';
import { supabase } from '../services/supabaseClient';
import SuitoLogo from '../components/SuitoLogo';
const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSlug = searchParams.get('slug'); // slug pre-asignado por el admin
    const preToken = searchParams.get('token'); // edit_token que autoriza el claim
    const { register, isAuthenticated, isLoading, error, clearError, user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [slug, setSlug] = useState(preSlug || '');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(`/${user.slug}`);
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        if (preSlug) return; // no auto-generar slug si viene del admin
        const generatedSlug = businessName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        setSlug(generatedSlug);
    }, [businessName, preSlug]);

    useEffect(() => {
        if (error) clearError();
        setLocalError(null);
    }, [email, password, confirmPassword, businessName, slug]);

    const validateForm = (): boolean => {
        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden');
            return false;
        }
        if (password.length < 6) {
            setLocalError('Mínimo 6 caracteres');
            return false;
        }
        if (!preSlug && slug.length < 3) {
            setLocalError('Nombre de negocio muy corto');
            return false;
        }
        return true;
    };

    // Flujo especial: el admin pre-creó el negocio, el cliente solo crea su contraseña
    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (!preToken) {
            setLocalError('Link inválido — pedile un enlace nuevo al administrador.');
            return;
        }
        setIsClaiming(true);
        setLocalError(null);
        try {
            const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) throw signUpError;

            if (authData.session) {
                // Sesión inmediata: reclamar el negocio
                const { error: claimError } = await supabase.rpc('claim_business', {
                    business_slug: preSlug,
                    p_edit_token: preToken,
                });
                if (claimError) throw claimError;
                navigate(`/${preSlug}`);
            } else {
                // Confirmación de email requerida
                setLocalError('Revisá tu email para confirmar tu cuenta. Luego podrás acceder a tu panel.');
            }
        } catch (err) {
            const raw = err instanceof Error ? err.message : '';
            const friendly =
                raw.includes('invalid_claim_token') || raw.includes('token_required')
                    ? 'Link inválido o expirado — pedile un enlace nuevo al administrador.'
                    : raw.includes('business_not_claimable')
                    ? 'Este negocio ya fue reclamado. Iniciá sesión en su lugar.'
                    : raw || 'Error al registrar. Verificá tu email.';
            setLocalError(friendly);
        } finally {
            setIsClaiming(false);
        }
    };

    // Flujo normal: el cliente se registra y crea su propio negocio
    const handleNormalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        await register(email, password, slug, businessName);
    };

    const handleSubmit = preSlug ? handleClaimSubmit : handleNormalSubmit;
    const displayError = localError || error;
    const isSubmitting = isLoading || isClaiming;

    return (
        <div className="flex flex-col min-h-screen bg-background text-on-surface font-sans relative overflow-hidden">

            {/* Mesh Background Decorative */}
            <div className="fixed inset-0 mesh-gradient-bg opacity-[0.06] -z-10" />

            {/* Header */}
            <header className="flex items-center justify-between pt-10 pb-4 px-6 z-20 sticky top-0 bg-background/60 backdrop-blur-xl border-b border-white/5">
                <Link
                    to="/login"
                    className="flex items-center justify-center size-10 rounded-2xl bg-surface border border-white/10 ambient-shadow hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-primary text-[20px]">arrow_back</span>
                </Link>
                <div className="flex-1 flex justify-end">
                    <div className="w-24 h-12">
                        <SuitoLogo />
                    </div>
                </div>
            </header>

            <div className="text-left px-8 pt-6 pb-8 animate-fade-in-up">
                <h1 className="text-3xl font-black tracking-tighter text-on-surface leading-none mb-2">
                    {preSlug ? 'Activá tu' : 'Creá tu'} <span className="text-primary italic">Cuenta</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                    {preSlug ? 'Tu panel ya está listo — solo creá tu contraseña' : 'Tu nueva etapa profesional comienza hoy'}
                </p>
            </div>

            <main className="flex-1 px-6 pb-20 overflow-y-auto no-scrollbar">
                <div className="glass-card ambient-shadow rounded-[3rem] p-7 border-white/60 max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Si viene del admin: mostrar slug como referencia, ocultar campos de negocio */}
                        {preSlug ? (
                            <div className="bg-primary/10 border border-primary/20 rounded-[1.5rem] p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Tu panel en Suito</p>
                                <p className="text-sm font-bold text-white opacity-90">suito.pro/turnos/#{preSlug}</p>
                                <p className="text-[10px] text-on-surface-variant opacity-60 mt-1">
                                    Usá el mismo email con el que te registró el admin
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Business Name */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                        Nombre de tu Negocio
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary/40">
                                            <span className="material-symbols-outlined text-[20px]">storefront</span>
                                        </span>
                                        <input
                                            type="text"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            className="block w-full rounded-[1.5rem] border border-white/10 bg-surface/60 pl-12 pr-4 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-white placeholder:text-white/20 transition-all ambient-shadow outline-none"
                                            placeholder="Ej: Max Barber Shop"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category Selector */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                        Tu Rubro Principal
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {BUSINESS_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                                className={`
                                                    p-3 rounded-2xl border transition-all text-left flex items-center gap-3
                                                    ${selectedCategory === cat.id
                                                        ? 'border-primary bg-primary/10 shadow-inner'
                                                        : 'border-white/5 bg-surface/40 hover:bg-surface/60 ambient-shadow'
                                                    }
                                                `}
                                            >
                                                <span className="text-lg grayscale-[0.5]">{cat.emoji}</span>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedCategory === cat.id ? 'text-primary' : 'text-on-surface-variant opacity-60'}`}>
                                                    {cat.nombre}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                 {/* Slug Preview */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                        Tu Enlace Profesional
                                    </label>
                                    <div className="bg-white/5 rounded-[1.5rem] p-4 border border-white/5 flex items-center gap-2">
                                        <span className="text-[10px] font-black text-on-surface-variant opacity-30">suito.pro/</span>
                                        <input
                                            type="text"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            className="flex-1 bg-transparent text-sm font-bold text-primary focus:outline-none placeholder:text-primary/20"
                                            placeholder="tu-negocio"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                Email de Acceso
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary/40">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-[1.5rem] border border-white/10 bg-surface/60 pl-12 pr-4 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-white placeholder:text-white/20 transition-all ambient-shadow outline-none"
                                    placeholder="hola@tuempresa.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                Crear Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary/40">
                                    <span className="material-symbols-outlined text-[20px]">lock_person</span>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-[1.5rem] border border-white/10 bg-surface/60 pl-12 pr-12 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-white placeholder:text-white/20 transition-all ambient-shadow outline-none"
                                    placeholder="Secreto de 6+ caracteres"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant/40 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary/40">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full rounded-[1.5rem] border border-white/10 bg-surface/60 pl-12 pr-4 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-white placeholder:text-white/20 transition-all ambient-shadow outline-none"
                                    placeholder="Repetí tu contraseña"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {displayError && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-xs text-red-600 font-bold animate-toast-in flex items-center gap-3">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {displayError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !email || !password || !confirmPassword || (!preSlug && (!businessName || !slug))}
                            className="group w-full mt-6 bg-primary text-white font-black py-5 rounded-[2rem] shadow-xl shadow-primary/30 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{preSlug ? 'Activar mi Panel' : 'Crear mi Universo'}</span>
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-2 transition-transform">
                                        {preSlug ? 'login' : 'rocket_launch'}
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                            ¿Ya sos parte?{' '}
                            <Link to="/login" className="text-primary hover:underline">
                                Iniciá Sesión
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="py-8 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <p className="text-[9px] font-bold text-on-surface-variant opacity-30 uppercase tracking-[0.2em]">
                        Simplificá tu vida · Suito Gold & Obsidian Edition
                    </p>
                </div>
            </main>
        </div>
    );
};

export default RegisterPage;
