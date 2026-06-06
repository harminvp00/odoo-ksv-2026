/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkPanel: '#1e293b',
        accentGreen: '#10b981',
      }
    },
  },
  plugins: [],
}
