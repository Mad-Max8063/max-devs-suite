import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_CATEGORIES } from '../constants';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated, isLoading, error, clearError, user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [slug, setSlug] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(`/${user.slug}`);
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        const generatedSlug = businessName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        setSlug(generatedSlug);
    }, [businessName]);

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
        if (slug.length < 3) {
            setLocalError('Nombre de negocio muy corto');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        await register(email, password, slug, businessName);
    };

    const displayError = localError || error;

    return (
        <div className="flex flex-col min-h-screen bg-white text-on-surface font-sans relative overflow-hidden">
            
            {/* Mesh Background Decorative */}
            <div className="fixed inset-0 mesh-gradient-bg opacity-[0.06] -z-10" />

            {/* Header */}
            <header className="flex items-center pt-10 pb-4 px-6 z-20 sticky top-0 bg-white/40 backdrop-blur-xl">
                <Link
                    to="/login"
                    className="flex items-center justify-center size-10 rounded-2xl bg-white border border-black/5 ambient-shadow hover:scale-105 transition-all"
                >
                    <span className="material-symbols-outlined text-primary text-[20px]">arrow_back</span>
                </Link>
            </header>

            <div className="text-left px-8 pt-6 pb-8 animate-fade-in-up">
                <h1 className="text-3xl font-black tracking-tighter text-on-surface leading-none mb-2">
                    Creá tu <span className="text-primary italic">Cuenta</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                    Tu nueva etapa profesional comienza hoy
                </p>
            </div>

            {/* Register Form */}
            <main className="flex-1 px-6 pb-20 overflow-y-auto no-scrollbar">
                <div className="glass-card ambient-shadow rounded-[3rem] p-7 border-white/60 max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
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
                                    className="block w-full rounded-[1.5rem] border border-black/5 bg-white/60 pl-12 pr-4 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/30 transition-all ambient-shadow"
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
                                                ? 'border-primary bg-primary/5 shadow-inner'
                                                : 'border-black/5 bg-white/40 hover:bg-white ambient-shadow'
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
                            <div className="bg-black/5 rounded-[1.5rem] p-4 border border-black/5 flex items-center gap-2">
                                <span className="text-[10px] font-black text-on-surface-variant opacity-30">suito.pro/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    className="flex-1 bg-transparent text-sm font-bold text-primary focus:outline-none"
                                    placeholder="tu-negocio"
                                    required
                                />
                            </div>
                        </div>

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
                                    className="block w-full rounded-[1.5rem] border border-black/5 bg-white/60 pl-12 pr-4 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/30 transition-all ambient-shadow"
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
                                    className="block w-full rounded-[1.5rem] border border-black/5 bg-white/60 pl-12 pr-12 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/30 transition-all ambient-shadow"
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
                            disabled={isLoading || !email || !password || !businessName || !slug}
                            className="group w-full mt-6 bg-primary text-white font-black py-5 rounded-[2rem] shadow-xl shadow-primary/30 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Crear mi Universo</span>
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-2 transition-transform">rocket_launch</span>
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
                        Simplificá tu vida · Suito Luminous Edition
                    </p>
                </div>
            </main>
        </div>
    );
};

export default RegisterPage;
