/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wall-bg': '#0a0a0f',
        'wall-surface': '#14141f',
      },
      fontFamily: {
        'display': ['"Noto Sans SC"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'float-fast': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'bottle-float': 'bottle-float 6s ease-in-out infinite',
        'bottle-splash': 'bottle-splash 1s ease-out forwards',
        'wave': 'wave 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '33%': { transform: 'translate3d(10px, -15px, 0)' },
          '66%': { transform: 'translate3d(-8px, -10px, 0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'bottle-float': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(-2deg)' },
          '25%': { transform: 'translate3d(5px, -8px, 0) rotate(3deg)' },
          '50%': { transform: 'translate3d(-3px, -12px, 0) rotate(-1deg)' },
          '75%': { transform: 'translate3d(-6px, -6px, 0) rotate(2deg)' },
        },
        'bottle-splash': {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '1' },
          '30%': { transform: 'translate3d(0, -80px, 0) scale(1.2)', opacity: '1' },
          '60%': { transform: 'translate3d(0, -150px, 0) scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'translate3d(0, -200px, 0) scale(0.5)', opacity: '0' },
        },
        'wave': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -5px, 0)' },
        },
      },
    },
  },
  plugins: [],
}
