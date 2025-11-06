/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brown-800': '#3A4466',
        'brown-900': '#262B44',
        'brown-100': '#F5F5F5',
      },
      fontFamily: {
        'display': ['Upheaval Pro', 'sans-serif'],
        'body': ['VCR OSD Mono', 'monospace'],
        'system': ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}