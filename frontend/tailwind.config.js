/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fashion: {
          bg: "#F9F9F9",
          charcoal: "#1A1A1A",
          muted: "#666666",
          gold: "#C5A059",
          navy: "#1B263B",
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        'xl': '24px',
      }
    },
  },
  plugins: [],
}
