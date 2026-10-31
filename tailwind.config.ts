import type { Config } from "tailwindcss";

const hsl = (v: string) => `hsl(var(--${v}))`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Onest", "system-ui", "sans-serif"],
        display: ["Onest", "system-ui", "sans-serif"],
      },
      colors: {
        background: hsl("background"),
        foreground: hsl("foreground"),
        card: { DEFAULT: hsl("card"), foreground: hsl("card-foreground") },
        primary: { DEFAULT: hsl("primary"), foreground: hsl("primary-foreground"), soft: hsl("primary-soft") },
        link: { DEFAULT: hsl("link"), foreground: hsl("link-foreground") },
        secondary: { DEFAULT: hsl("secondary"), foreground: hsl("secondary-foreground") },
        muted: { DEFAULT: hsl("muted"), foreground: hsl("muted-foreground") },
        accent: { DEFAULT: hsl("accent"), foreground: hsl("accent-foreground") },
        destructive: { DEFAULT: hsl("destructive"), foreground: hsl("destructive-foreground") },
        border: hsl("border"),
        input: hsl("input"),
        ring: hsl("ring"),
        "c-pink": hsl("c-pink"),
        "c-lilac": hsl("c-lilac"),
        "c-sky": hsl("c-sky"),
        "c-lime": hsl("c-lime"),
        "c-amber": hsl("c-amber"),
        "tile-sky": hsl("tile-sky"),
        "tile-lilac": hsl("tile-lilac"),
        "tile-rose": hsl("tile-rose"),
      },
      borderRadius: { lg: "var(--radius)" },
    },
  },
  plugins: [],
} satisfies Config;
