/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./api/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#fdf2ea',
          card: '#f7e6db',
          border: '#e8cfc0',
        },
        maroon: {
          DEFAULT: '#3a0d22',
          dark: '#2b0818',
          light: '#4a102b',
        },
        coral: {
          DEFAULT: '#df6d73',
          hover: '#c85b61',
        },
        mauve: {
          DEFAULT: '#6f4658',
          light: '#8b5e73',
        },
        dustyRose: '#b15260',
        'dusty-rose': '#b15260',
      },
    },
  },
  plugins: [],
};
