import type { Config } from "tailwindcss";
import path from "path";

const root = __dirname;

const config: Config = {
  content: [
    path.join(root, "pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(root, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(root, "app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(root, "lib/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#0F6E56",
          "green-dark": "#0a5040",
          "green-light": "#e8f4f1",
          orange: "#EF9F27",
          "orange-dark": "#d4881a",
          "orange-light": "#fdf3e3",
        },
        // Sidebar oscuro (más profundo que el #0A5C47 anterior)
        sidebar: {
          bg: "#073929",
        },
        // Tinta y muted — más ricos que gray-* genéricos
        ink:    "#0F1B2D",  // títulos
        ink2:   "#27374D",  // texto cuerpo
        muted:  "#6B7689",  // meta/labels
        border: "#E5E8EE",
        bg:     "#F6F7F9",  // fondo app
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightish: "-0.3px",
        tighter2: "-0.6px",
      },
    },
  },
  plugins: [],
};
export default config;
