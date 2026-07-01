/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Stellar-brand dark navy + indigo + bright-blue accent palette
        navy: {
          950: '#060b1a',
          900: '#0a1128',
          800: '#0e1a3a',
          700: '#162247',
          600: '#1e2e5c',
        },
        stellar: {
          50:  '#eef5ff',
          100: '#d9e9ff',
          200: '#b9d5ff',
          300: '#8ab8ff',
          400: '#5491ff',
          500: '#2d6aff',
          600: '#1a4fff',
          700: '#1441e0',
          800: '#1536b5',
          900: '#17318e',
          950: '#111e5a',
        },
        indigo: {
          950: '#1e1b4b',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #060b1a 0%, #0e1a3a 40%, #162247 70%, #1441e0 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(30,46,92,0.8) 0%, rgba(14,26,58,0.9) 100%)',
        'stellar-gradient': 'linear-gradient(90deg, #2d6aff 0%, #5491ff 50%, #1a4fff 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'stellar': '0 0 20px rgba(45,106,255,0.3), 0 4px 24px rgba(0,0,0,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',
        'glow': '0 0 40px rgba(45,106,255,0.4)',
        'inner-glow': 'inset 0 0 20px rgba(45,106,255,0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
