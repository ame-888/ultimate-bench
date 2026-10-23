// @ts-check
import { defineConfig } from 'astro/config';


// https://astro.build/config
export default defineConfig({
  site: 'https://ultimate-bench.vercel.app/',
  // Keep each generated page and its styles in the same deployment artifact.
  // This prevents cached HTML from pointing at a pruned, hashed CSS bundle during
  // a deployment, which otherwise leaves the site partially or wholly unstyled.
  build: {
    inlineStylesheets: 'always'
  }
});
