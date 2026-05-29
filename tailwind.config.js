/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'thai-blue': '#1E3A8A',
        'thai-red': '#DC2626',
      },
      fontFamily: {
        sans: ['Sarabun', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
