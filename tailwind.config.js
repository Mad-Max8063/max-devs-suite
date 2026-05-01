/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./landing/**/*.{js,ts,jsx,tsx,html}",
        "./turnos/**/*.{js,ts,jsx,tsx,html}",
        "./card/**/*.{js,ts,jsx,tsx,html}",
        "./admin/**/*.{js,ts,jsx,tsx,html}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#D4AF37",
                "primary-dark": "#B8860B",
                "primary-hover": "#B8860B",
                "secondary": "#E5C158",
                "tertiary": "#A67C00",
                "surface": {
                    DEFAULT: "#1E1E1E",
                    light: "#FFFFFF",
                    dark: "#1E1E1E",
                    2: "#2C2C2C",
                },
                "background": {
                    DEFAULT: "#121212",
                    light: "#F8FAFC",
                    dark: "#121212",
                },
                "on-surface": "#F5F5F5",
                "on-surface-variant": "#A0A0A0",
                "text-primary-light": "#111827",
                "text-primary-dark": "#F9FAFB",
                "text-secondary-light": "#4B5563",
                "text-secondary-dark": "#A0A0A0",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"],
                "sans": ["Plus Jakarta Sans", "Inter", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "2xl": "1.5rem",
                "3xl": "2rem",
                "full": "9999px",
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'slide-up': 'slideUp 0.3s ease-out forwards',
                'scale-in': 'scaleIn 0.2s ease-out forwards',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(100%)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
    ],
};
