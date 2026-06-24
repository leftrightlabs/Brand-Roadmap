/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // LRL Brand 2025 — official palette
        navy:  '#112248',
        lime:  '#a7c140',
        // Convenience aliases
        'lrl-navy':  '#112248',
        'lrl-lime':  '#a7c140',
        'lrl-white': '#ffffff',
        'lrl-black': '#000000',
      },
      fontFamily: {
        heading: ['scotch-display', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['sweet-sans-pro', 'Montserrat', 'Inter', 'Arial', 'sans-serif'],
        worksans: ['sweet-sans-pro', 'Montserrat', 'Inter', 'Arial', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.7s ease-out forwards'
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 