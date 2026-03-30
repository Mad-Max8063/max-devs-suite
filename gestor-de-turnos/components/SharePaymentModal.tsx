import React, { useState } from 'react';

interface SharePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    aliasMP: string;
    linkPago?: string;
    qrImageUrl?: string;
    valorSena: number;
    nombreNegocio: string;
}

/**
 * Modal para compartir fácilmente los datos de pago
 */
const SharePaymentModal: React.FC<SharePaymentModalProps> = ({
    isOpen,
    onClose,
    aliasMP,
    linkPago,
    qrImageUrl,
    valorSena,
    nombreNegocio
}) => {
    const [copied, setCopied] = useState<string | null>(null);

    if (!isOpen) return null;

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            alert(`${label}: ${text}`);
        }
    };

    const shareViaWhatsApp = () => {
        const message = `¡Hola! Para reservar tu turno en ${nombreNegocio}, podés abonar la seña de $${valorSena.toLocaleString('es-AR')} a:\n\n💳 Alias: ${aliasMP}${linkPago ? `\n🔗 Link de pago: ${linkPago}` : ''}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-dark p-5 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Compartir Datos de Pago</h3>
                        <button
                            onClick={onClose}
                            className="size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <p className="text-white/80 text-sm mt-1">
                        Seña: <strong>${valorSena.toLocaleString('es-AR')}</strong>
                    </p>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Alias Section */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Alias de Mercado Pago
                        </label>
                        <div
                            onClick={() => copyToClipboard(aliasMP, 'Alias')}
                            className="flex items-center gap-3 bg-gray-100 dark:bg-background-dark p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                        >
                            <div className="flex-1 font-mono text-base font-semibold text-gray-800 dark:text-white truncate">
                                {aliasMP}
                            </div>
                            <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${copied === 'Alias' ? 'bg-green-500 text-white' : 'bg-white dark:bg-surface-dark text-gray-600 group-hover:text-primary'}`}>
                                <span className="material-symbols-outlined text-[20px]">
                                    {copied === 'Alias' ? 'check' : 'content_copy'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Link de Pago Section */}
                    {linkPago && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Link de Pago
                            </label>
                            <div
                                onClick={() => copyToClipboard(linkPago, 'Link')}
                                className="flex items-center gap-3 bg-gray-100 dark:bg-background-dark p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                            >
                                <div className="flex-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                                    {linkPago}
                                </div>
                                <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${copied === 'Link' ? 'bg-green-500 text-white' : 'bg-white dark:bg-surface-dark text-gray-600 group-hover:text-primary'}`}>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {copied === 'Link' ? 'check' : 'content_copy'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* QR Section */}
                    {qrImageUrl && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Código QR
                            </label>
                            <div className="flex justify-center bg-white p-4 rounded-xl border-2 border-dashed border-gray-200">
                                <img
                                    src={qrImageUrl}
                                    alt="QR de pago"
                                    className="w-36 h-36 rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Share Button */}
                    <button
                        onClick={shareViaWhatsApp}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-green-500/25 transition-all active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[22px]">share</span>
                        Compartir por WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePaymentModal;
