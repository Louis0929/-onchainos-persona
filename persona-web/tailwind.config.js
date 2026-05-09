/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0a0a1a",
          panel: "#111128",
          border: "#2a2a5a",
          accent: "#00f0ff",
          pink: "#ff00aa",
          green: "#00ff88",
          yellow: "#ffdd00",
          red: "#ff3355",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
