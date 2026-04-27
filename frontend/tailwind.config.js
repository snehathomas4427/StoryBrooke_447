/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif Pro"', '"Georgia"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"]
      },
      colors: {
        cream: {
          50: "#fbf7f1",
          100: "#f5ecdd",
          200: "#ecdcc1"
        },
        brand: {
          50: "#fbf3ec",
          100: "#f3e0cb",
          200: "#e6c096",
          300: "#d49d63",
          400: "#b87a3a",
          500: "#8c5a2b",
          600: "#6c4421",
          700: "#4f311a",
          800: "#3a2414",
          900: "#26170c"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(38, 23, 12, 0.06), 0 4px 16px rgba(38, 23, 12, 0.06)"
      }
    }
  },
  plugins: []
};
