import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FDF5EC',
          100: '#F9E5CC',
          200: '#F0C48A',
          300: '#E5A84B',
          400: '#D4891A',
          500: '#C8851A',
          600: '#A06312',
          700: '#7B3F1E',
          800: '#5C2E12',
          900: '#3D1A08',
          950: '#1E0B00',
        },
        space: {
          900: '#050510',
          800: '#080820',
          700: '#0D0D2E',
          600: '#12123C',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'slide-up':    'slideUp 0.6s ease-out forwards',
        'fade-in':     'fadeIn 0.8s ease-out forwards',
        'shimmer':     'shimmer 2.5s linear infinite',
        'spin-slow':   'spin 12s linear infinite',
        'marquee':     'marquee 35s linear infinite',
        'twinkle':     'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-18px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(200,133,26,0.3)' },
          '50%':      { boxShadow: '0 0 55px rgba(200,133,26,0.85)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.3', transform: 'scale(0.6)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-shimmer':    'linear-gradient(90deg, transparent 0%, rgba(200,133,26,0.4) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config
