import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import tailwindcss from '@tailwindcss/vite';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const searchPreview = {
  name: 'duobump-search-preview',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const base = process.env.BASE_PATH || '/';
      const request = new URL(req.url || '/', 'http://localhost');
      if (
        (request.pathname === base || request.pathname === base + 'index.html') &&
        !request.searchParams.has('render')
      ) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(await readFile('public/entry.html', 'utf8'));
      }
      if (request.pathname === base + 'index.content.html') {
        req.url = base + '?render=1';
        return next();
      }
      const marker = '/__search/';
      const pathname = (req.url || '').split('?')[0];
      const start = pathname.indexOf(marker);
      if (start < 0) return next();
      let rel;
      try {
        rel = decodeURIComponent(pathname.slice(start + marker.length));
      } catch {
        res.statusCode = 400;
        return res.end();
      }
      const root = resolve('dist/pagefind');
      const file = resolve(root, rel);
      if (!file.startsWith(root + sep)) {
        res.statusCode = 404;
        return res.end();
      }
      try {
        const buffer = await readFile(file);
        res.setHeader(
          'Content-Type',
          rel.endsWith('.js')
            ? 'application/javascript'
            : rel.endsWith('.wasm')
              ? 'application/wasm'
              : 'application/octet-stream',
        );
        res.end(buffer);
      } catch {
        res.statusCode = 404;
        res.end('Build the search index first: npm run build');
      }
    });
  },
};

// Markdown content uses root-relative editorial links. Prefix those at build
// time so the static fallback and the hash router both work in repo Pages.
function markdownBaseLinks() {
  const base = '/' + (process.env.BASE_PATH || '/').split('/').filter(Boolean).join('/');
  const prefix = base === '/' ? '' : base;
  return {
    name: 'duobump-base-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (
          prefix &&
          typeof href === 'string' &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          href !== prefix &&
          !href.startsWith(prefix + '/')
        ) {
          ctx.setProperty(node, 'href', prefix + href);
        }
      },
    },
  };
}

export default defineConfig({
  output: 'static',
  outDir: process.env.BUILD_DIR || './dist',
  site: process.env.SITE_URL || 'https://example.invalid',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  markdown: { processor: satteri({ hastPlugins: [markdownBaseLinks] }) },
  vite: { plugins: [tailwindcss(), searchPreview] },
  server: { host: true, port: 4321 },
});
