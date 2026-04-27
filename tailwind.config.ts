import type { Config } from "tailwindcss";
import path from "path";

const projectRoot = path.resolve(__dirname);

const config: Config = {
  content: [
    path.join(projectRoot, "pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(projectRoot, "app/**/*.{js,ts,jsx,tsx,mdx}"),
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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
