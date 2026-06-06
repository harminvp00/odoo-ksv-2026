/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#ffffff',
          panel: '#fafafa',
          border: '#e5e5e5',
          text: '#171717',
          muted: '#737373',
          darkBg: '#0a0a0a',
        },
        accent: {
          success: '#10b981',      // Soft emerald
          successBg: '#ecfdf5',
          danger: '#f43f5e',       // Soft rose
          dangerBg: '#fff1f2',
          warning: '#f59e0b',      // Soft amber
          warningBg: '#fef3c7',
        }
      },
      boxShadow: {
        premium: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        cardHover: '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
