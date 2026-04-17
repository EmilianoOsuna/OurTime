/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9b4500',
          container: '#f17720',
        },
        secondary: {
          DEFAULT: '#00629f',
          container: '#64b3fd',
        },
        surface: {
          DEFAULT: '#f9f9f9',
          low: '#f4f3f3',
          highest: '#e2e2e2',
          lowest: '#ffffff',
          variant: '#e2e2e2',
        },
        'on-surface': '#1a1c1c',
        'outline-variant': '#dec0b1',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'full': '3rem',
      },
      backdropBlur: {
        'lg': '20px',
      }
    },
  },
  plugins: [],
}
