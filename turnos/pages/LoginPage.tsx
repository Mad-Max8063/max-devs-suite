import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SuitoLogo from '../components/SuitoLogo';
const features = [
    { icon: 'block', text: 'Chau plante 👋', desc: 'Seña obligatoria = clientes comprometidos', color: 'from-orange-400 to-rose-500' },
    { icon: 'payments', text: 'Cobrás antes', desc: 'Te entra la seña automática por MP', color: 'from-emerald-400 to-teal-600' },
    { icon: 'link', text: 'Link propio', desc: 'Mandalo por Insta, WhatsApp o donde quieras', color: 'from-blue-400 to-indigo-600' },
    { icon: 'trending_up', text: 'Estadísticas', desc: 'Mirá cuánto facturás cada día de un vistazo', color: 'from-violet-400 to-purple-600' },
];

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, error, isLoading } = useAuth();
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    const handleSubmit = async () => {
        if (!email || !password) return;
        if (tab === 'login') {
            const success = await login(email, password);
            if (success) {
                navigate('/');
            }
        } else {
            navigate('/register');
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % features.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleDemo = () => {
        navigate('/demo');
    };

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-white text-on-surface font-sans">
            
            {/* Mesh Background Decorative */}
            <div className="fixed inset-0 mesh-gradient-bg opacity-[0.08] -z-10" />

            {/* Hero branding */}
            <div className="flex flex-col items-center pt-16 pb-8 px-6 z-10 relative animate-fade-in-up">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-2xl scale-150" />
                    <div className="relative w-48 h-24 flex items-center justify-center">
                        <SuitoLogo />
                    </div>
                </div>
                <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center">
                    Gestión Editorial para Emprendedores
                </p>
            </div>

            {/* Feature carousel */}
            <div className="px-8 mb-8 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <div className="relative h-[80px] overflow-hidden">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className={`absolute inset-0 flex items-center gap-4 p-5 rounded-[2rem] bg-white/40 backdrop-blur-xl border border-white/60 shadow-sm transition-all duration-700 ease-out ${i === activeFeature
                                ? 'opacity-100 translate-y-0 scale-100'
                                : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
                                }`}
                        >
                            <div className={`shrink-0 size-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center ambient-shadow`}>
                                <span className="material-symbols-outlined text-white text-[22px]">{f.icon}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-on-surface uppercase tracking-widest leading-none mb-1">{f.text}</p>
                                <p className="text-[10px] font-bold text-on-surface-variant opacity-60 leading-tight">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                    {features.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveFeature(i)}
                            className={`rounded-full transition-all duration-500 ${i === activeFeature ? 'w-8 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-black/10'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Auth Card */}
            <div className="flex-1 px-6 pb-12 z-10 relative animate-fade-in-up md:max-w-md md:mx-auto" style={{ animationDelay: '0.3s' }}>
                <div className="glass-card ambient-shadow rounded-[3rem] p-7 overflow-hidden border-white/60">

                    {/* Tab switcher */}
                    <div className="flex p-1.5 bg-black/5 mb-8 rounded-[1.5rem]">
                        <button
                            onClick={() => setTab('login')}
                            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'login'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-on-surface-variant opacity-40 hover:opacity-100'
                                }`}
                        >
                            Ingresar
                        </button>
                        <button
                            onClick={() => setTab('register')}
                            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'register'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-on-surface-variant opacity-40 hover:opacity-100'
                                }`}
                        >
                            Registrarme
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                Email Profesional
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary/40">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="block w-full rounded-[1.5rem] border border-black/5 bg-white/60 pl-12 pr-4 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/30 transition-all ambient-shadow"
                                    placeholder="tu@negocio.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-40">
                                Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-primary/40">
                                    <span className="material-symbols-outlined text-[20px]">lock_open</span>
                                </span>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="block w-full rounded-[1.5rem] border border-black/5 bg-white/60 pl-12 pr-12 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-on-surface placeholder:text-on-surface-variant/30 transition-all ambient-shadow"
                                    placeholder="Tu clave secreta"
                                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant/40 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-xs text-red-600 font-bold animate-toast-in">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !email || !password}
                            className="group w-full mt-4 bg-primary text-white font-black py-5 rounded-[2rem] shadow-xl shadow-primary/30 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {tab === 'login' ? 'Iniciar Sesión' : 'Comenzar Ahora'}
                                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-black/5 flex-1" />
                            <span className="text-[10px] font-black text-on-surface-variant opacity-20 uppercase tracking-widest">o</span>
                            <div className="h-px bg-black/5 flex-1" />
                        </div>

                        <button
                            onClick={handleDemo}
                            className="w-full py-4 rounded-[1.5rem] border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest bg-white/40 hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">auto_awesome</span>
                            Explorar Versión Demo
                        </button>

                    </div>
                </div>

                <div className="mt-8 text-center space-y-3 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                        🇦🇷 Únite a +500 emprendedores
                    </p>
                    <p className="text-[9px] font-bold text-primary opacity-60">
                        Simple. Profesional. Luminous.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
