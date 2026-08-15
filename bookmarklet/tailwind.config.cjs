/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,html}", "./template/**/*.html"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ink: "#f2eee4",
        ticket: "#202938",
        ticket2: "#1a2230",
        rule: "#374153",
        faint: "#9aa4b6",
        lime: "#41d484",
        rose: "#ff7084",
        cyan: "#5fd4ff",
        gold: "#f7b955",
        blacktop: "#07090e",
      },
      fontFamily: {
        // Ledger serif — used with restraint for the big figures and headings.
        display: ["Georgia", '"Times New Roman"', "serif"],
        // Tabular labels for eyebrows and column headers.
        utility: ['"Arial Narrow"', '"Segoe UI"', "sans-serif"],
        // Ticket-print monospace for serials, field codes and receipt lines.
        mono: ['"Geist Mono"', '"Courier New"', "monospace"],
      },
      backgroundImage: {
        app: "radial-gradient(circle at 12% 0,#223047 0 20%,transparent 42%),linear-gradient(135deg,#0a0d12,#171922 55%,#0e1219)",
      },
    },
  },
  plugins: [],
};
