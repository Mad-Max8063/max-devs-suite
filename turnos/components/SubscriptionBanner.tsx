import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';

export const SubscriptionBanner: React.FC = () => {
    const { profile } = useApp();
    const [loading, setLoading] = useState(false);

    if (!profile) return null;

    const status = profile.subscription_status || 'none';
    const trialEndsAt = profile.trial_ends_at;

    // We only show the banner if they are in trial or have no subscription
    if (profile.IsPremium || status === 'active') return null;

    const isExpired = trialEndsAt ? new Date(trialEndsAt) < new Date() : false;
    const daysLeft = trialEndsAt 
        ? Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-pricing-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    business_id: profile.id,
                    plan_type: 'combo'
                })
            });

            const data = await response.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                alert('No se pudo generar el link de pago. Reintenta en unos momentos.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con Mercado Pago.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: isExpired ? '#fee2e2' : '#fef3c7',
            border: `1px solid ${isExpired ? '#f87171' : '#fbbf24'}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '18px', 
                    fontWeight: 700,
                    color: isExpired ? '#991b1b' : '#92400e'
                }}>
                    {isExpired ? '🚨 Período de prueba finalizado' : '✨ Tu prueba gratuita está activa'}
                </h3>
                
                <p style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '14px', 
                    lineHeight: '1.5',
                    color: isExpired ? '#b91c1c' : '#a16207'
                }}>
                    {isExpired 
                        ? 'Tu acceso al Gestor de Turnos ha sido pausado. Suscribite ahora para recuperar el control de tu agenda y seguir recibiendo reservas.'
                        : `Te quedan ${daysLeft} días de prueba completa. Suscribite hoy para asegurar tu precio actual contra la inflación (congelado por 90 días).`
                    }
                </p>

                <button 
                    onClick={handleSubscribe}
                    disabled={loading}
                    style={{
                        background: isExpired ? '#dc2626' : '#d97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: 600,
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        width: '100%',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {loading ? 'Procesando...' : (isExpired ? 'Reactivar mi Agenda' : 'Suscribirme y Congelar Precio')}
                </button>

                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
                    <img src="https://www.mercadopago.com/instore/merchant/resources/images/check.svg" width="16" alt="MP" />
                    <span style={{ fontSize: '11px', color: isExpired ? '#b91c1c' : '#a16207' }}>
                        Cobro local en Pesos Argentinos vía Mercado Pago
                    </span>
                </div>
            </div>
            
            {/* Background elements for flair */}
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderRadius: '50%',
                zIndex: 0
            }}></div>
        </div>
    );
};
