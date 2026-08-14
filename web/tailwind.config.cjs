/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,html}", "./template/**/*.html"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ink: "#f5f1e8",
        ticket: "#1f2632",
        ticket2: "#19202b",
        rule: "#343c4b",
        faint: "#aab0bc",
        lime: "#44d27f",
        rose: "#ff6378",
        cyan: "#67d8ff",
        gold: "#f7b955",
        blacktop: "#080a0f",
      },
      fontFamily: {
        display: ['Georgia', '"Times New Roman"', "serif"],
        utility: ['"Arial Narrow"', '"Segoe UI"', "sans-serif"],
      },
      backgroundImage: {
        app:
          "radial-gradient(circle at 12% 0,#223047 0 20%,transparent 42%),linear-gradient(135deg,#0a0d12,#171922 55%,#0e1219)",
      },
    },
  },
  plugins: [],
};
