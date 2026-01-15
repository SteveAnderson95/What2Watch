/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FFA500',
          accent: '#FFD700',
          bg: '#0F1419',
          card: '#1C1F26',
          soft: '#2A2F3A'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,165,0,.25), 0 12px 30px rgba(0,0,0,.35)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .5s ease forwards',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
