/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',  /* Custom sidebar spacing */
        '4.5': '1.125rem',  /* Custom message spacing */
      }
    },
  },
  plugins: [],
}
