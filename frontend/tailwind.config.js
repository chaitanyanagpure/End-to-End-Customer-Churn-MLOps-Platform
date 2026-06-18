/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Deep Blue
          hover: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#4F46E5', // Indigo
          hover: '#4338CA',
        },
        accent: {
          DEFAULT: '#10B981', // Emerald Green
          hover: '#059669',
        },
        background: '#F8FAFC', // Soft White
        card: '#FFFFFF',       // Pure White
        text: {
          DEFAULT: '#1F2937', // Dark Gray
          muted: '#6B7280',   // Medium Gray
        },
        border: '#E5E7EB',     // Light Gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
