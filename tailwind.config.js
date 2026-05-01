/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { gold: '#d4b98c', 'gold-light': '#f0d9b0', ink: '#080807', surface: '#111110', surface2: '#1a1916' } } },
  plugins: [],
}
