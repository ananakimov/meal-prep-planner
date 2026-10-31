import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site from /meal-prep-planner/
export default defineConfig({
  plugins: [react()],
  base: "/meal-prep-planner/",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
