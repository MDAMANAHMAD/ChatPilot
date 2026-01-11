/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pilot: {
          'bg': '#0f172a',
          'surface': '#1e293b',
          'primary': '#6366f1',
          'primary-hover': '#4f46e5',
          'secondary': '#94a3b8',
          'accent': '#8b5cf6',
          'border': '#334155',
          'incoming': '#334155',
          'outgoing': '#4f46e5',
          'text-main': '#f8fafc',
          'text-muted': '#94a3b8',
          'header': '#1e293b',
        }
      }
    },
  },
  plugins: [],
}
