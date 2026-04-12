import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabaseClient';
import { sheetsService } from '../services/sheetsService';

// ============================================
// TYPES
// ============================================
export interface User {
    email: string;
    slug: string;
    createdAt: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

interface AuthActions {
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, slug: string, businessName: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

type AuthContextType = AuthState & AuthActions;

// ============================================
// LOCAL STORAGE KEYS (kept for demo mode)
// ============================================
const AUTH_STORAGE_KEY = 'turnos_auth_user';

// ============================================
// CONTEXT
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize: check for existing Supabase session
    useEffect(() => {
        const initAuth = async () => {
            // Check Supabase session first
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Get business slug for this user
                const { data: bizData } = await supabase
                    .from('businesses')
                    .select('slug')
                    .eq('user_id', session.user.id)
                    .single();

                if (bizData) {
                    setUser({
                        email: session.user.email || '',
                        slug: bizData.slug,
                        createdAt: session.user.created_at,
                    });
                }
            } else {
                // Fall back to localStorage (demo mode)
                const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser) as User);
                    } catch {
                        localStorage.removeItem(AUTH_STORAGE_KEY);
                    }
                }
            }
            setIsLoading(false);
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                logger.debug('[Auth] State changed:', event);

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    localStorage.removeItem(AUTH_STORAGE_KEY);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Login function
    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Use Supabase Auth — pass raw password
            const result = await sheetsService.loginUser(email, '', password);

            const userData: User = {
                email: result.user.email,
                slug: result.user.slug,
                createdAt: result.user.createdAt,
            };
            setUser(userData);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Register function
    const register = useCallback(async (
        email: string,
        password: string,
        slug: string,
        businessName: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Validate slug format
            const slugRegex = /^[a-z0-9-]+$/;
            if (!slugRegex.test(slug)) {
                setError('El slug solo puede contener letras minúsculas, números y guiones');
                return false;
            }

            // Check if slug already exists
            const existingProfile = await sheetsService.getProfile(slug);
            if (existingProfile) {
                setError('Este slug ya está en uso. Prueba con otro.');
                return false;
            }

            // Register with Supabase — pass raw password
            const result = await sheetsService.registerUser(email, '', slug, businessName, password);

            const userData: User = {
                email,
                slug,
                createdAt: new Date().toISOString(),
            };
            setUser(userData);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrar');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Logout function
    const logout = useCallback(() => {
        supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = React.useMemo(() => ({
        user,
        isAuthenticated: user !== null,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
    }), [user, isLoading, error, login, register, logout, clearError]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
