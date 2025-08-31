/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#E0E7FF',
        accent: '#6366F1',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text_primary: '#1F2937',
        text_secondary: '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0px 4px 6px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}
