import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://oliver-raczka.vercel.app',
  output: 'static',
  integrations: [mdx(), sitemap()],
});
