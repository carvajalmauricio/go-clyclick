/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        clickclick: {
          orange: '#F49120',
          dark: '#0f0f12',
        },
      },
    },
  },
  plugins: [],
}
