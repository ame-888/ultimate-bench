import { readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const origin = 'https://ultimate-bench.vercel.app';
const outputDirectory = new URL('../dist/', import.meta.url).pathname;

async function findHtml(directory) {
  const paths = [];
  for (const entry of await readdir(directory)) {
    const path = join(directory, entry);
    const details = await stat(path);
    if (details.isDirectory()) paths.push(...await findHtml(path));
    else if (entry.endsWith('.html')) paths.push(path);
  }
  return paths;
}

const excludedRoutes = new Set(['/methodology/full/', '/methodology/visual-bench/', '/methodology/data-bench/', '/methodology/chess-bench/']);

const urls = (await findHtml(outputDirectory)).map((path) => {
  const page = relative(outputDirectory, path).split(sep).join('/');
  const route = page === 'index.html' ? '/' : `/${page.replace(/\/index\.html$/, '').replace(/\.html$/, '')}/`;
  return new URL(route, origin).href;
}).filter(url => !excludedRoutes.has(new URL(url).pathname)).sort();

const urlset = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
const index = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${origin}/sitemap-0.xml</loc></sitemap>\n</sitemapindex>\n`;

await writeFile(join(outputDirectory, 'sitemap-0.xml'), urlset);
await writeFile(join(outputDirectory, 'sitemap-index.xml'), index);
console.log(`Generated sitemap for ${urls.length} public routes.`);
