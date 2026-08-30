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
        soil: '#2C2118',
        wheat: '#C4A35A',
        sage: '#4A7A51',
        rust: '#C0622E',
        stone: '#7A6554',
        linen: '#F3EEE4',
        paper: '#F3EEE4',
        card: '#FAF6EF',
        ink: '#2C2118',
        brick: '#A44A2C',
        forest: '#1E3A2F',
        'forest-hover': '#2A4F41',
        gold: '#C4A35A',
        espresso: '#231A10',
        'sage-wash': '#E4EDE6',
        hair: 'rgba(44,33,24,0.12)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Iowan Old Style', 'Palatino', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', '"Source Sans Pro"', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      borderRadius: {
        btn: '8px',
        panel: '12px',
      },
    },
  },
  plugins: [],
}
