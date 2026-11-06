/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#0B0B0C',
        carbon: '#141416',
        steel: '#2A2A30',
        ember: {
          DEFAULT: '#E02A1F',
          hot: '#FF5A4D',
          dark: '#B01C12'
        },
        gold: {
          DEFAULT: '#F5B53C',
          glow: 'rgba(245, 181, 60, 0.25)'
        },
        streak: {
          DEFAULT: '#34D27B',
          glow: 'rgba(52, 210, 123, 0.25)'
        },
        chalk: '#F4F4F5',
        muted: '#9A9AA3'
      },
      fontFamily: {
        headline: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      borderRadius: {
        'card': '14px'
      }
    },
  },
  plugins: [],
}
