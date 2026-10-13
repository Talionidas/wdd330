import {defineConfig} from "vite";
import {resolve} from "node:path";

export default defineConfig({
  appType:"mpa",
  build:{
    rollupOptions:{
      input:{
        main:resolve(import.meta.dirname,"index.html"),
        game:resolve(import.meta.dirname,"game.html"),
        deals:resolve(import.meta.dirname,"deals.html"),
        favorites:resolve(import.meta.dirname,"favorites.html")
      }
    }
  }
});
