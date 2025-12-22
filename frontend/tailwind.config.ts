import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        sidebar: '#f8fafc',
        card: '#ffffff',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0,0,0,0.05)'
      },
      animation: {
        blob: 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config
