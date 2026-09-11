/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14181C",
        slate: "#1E252B",
        steel: {
          DEFAULT: "#2F6F8F",
          light: "#4A8CAD",
          dark: "#245A73",
        },
        signal: {
          DEFAULT: "#D98A2B",
          light: "#E8A54F",
        },
        rust: "#C6512B",
        leaf: "#3F8F5C",
        canvas: "#F5F6F7",
        line: "#E1E4E7",
        ink2: "#1B2126",
        muted: "#5B6570",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      backdropFilter: {
        none: "none",
        sm: "blur(4px)",
        md: "blur(10px)",
        lg: "blur(20px)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(74, 140, 173, 0.1)",
        "glass-lg": "0 8px 32px 0 rgba(74, 140, 173, 0.2)",
        glow: "0 0 20px rgba(74, 140, 173, 0.3)",
        "glow-lg": "0 0 30px rgba(74, 140, 173, 0.5)",
      },
    },
  },
  plugins: [],
};
