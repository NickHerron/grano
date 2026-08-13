/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        soil:   '#1E1509',
        wheat:  '#C8943A',
        sage:   '#4A7A51',
        rust:   '#C0622E',
        stone:  '#6B6355',
        linen:  '#F7F5F1',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
