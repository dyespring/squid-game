/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'squid-pink': '#FF4581',
        'guard-pink': '#F74F8E',
        'tracksuit-green': '#008C62',
        'background-cream': '#F5E6D3',
        'concrete-gray': '#8C8C8C',
        'danger-red': '#E63946',
        'geometric-black': '#1A1A1A',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': {
            opacity: '1',
            borderColor: '#E63946',
          },
          '50%': {
            opacity: '0.5',
            borderColor: '#FF6B6B',
          },
        },
        'shake': {
          '10%, 90%': {
            transform: 'translate3d(-1px, 0, 0)',
          },
          '20%, 80%': {
            transform: 'translate3d(2px, 0, 0)',
          },
          '30%, 50%, 70%': {
            transform: 'translate3d(-4px, 0, 0)',
          },
          '40%, 60%': {
            transform: 'translate3d(4px, 0, 0)',
          },
        },
      },
    },
  },
  plugins: [],
}
