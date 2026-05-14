import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that updates og:image and twitter:image meta tags
 * to point to the app's opengraph image with the correct Replit domain.
 */
export function metaImagesPlugin(): Plugin {
  return {
    name: 'vite-plugin-meta-images',
    transformIndexHtml(html) {
      const baseUrl = getDeploymentUrl();
      if (!baseUrl) {
        log('[meta-images] no Replit deployment domain found, skipping meta tag updates');
        return html;
      }

      // Check for the WhatsApp/OG preview image. Prefer whatsapp-preview.png
      // (1200x630 — recommended by WhatsApp/Facebook), fall back to legacy names.
      const publicDir = path.resolve(process.cwd(), 'client', 'public');
      const candidates: Array<[string, string]> = [
        ['whatsapp-preview.png', 'whatsapp-preview.png'],
        ['opengraph.png', 'opengraph.png'],
        ['opengraph.jpg', 'opengraph.jpg'],
        ['opengraph.jpeg', 'opengraph.jpeg'],
      ];

      const found = candidates.find(([fname]) => fs.existsSync(path.join(publicDir, fname)));

      if (!found) {
        log('[meta-images] OpenGraph image not found, skipping meta tag updates');
        return html;
      }

      const imageUrl = `${baseUrl}/${found[1]}`;

      log('[meta-images] updating meta image tags to:', imageUrl);

      html = html.replace(
        /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g,
        `<meta property="og:image" content="${imageUrl}" />`
      );

      html = html.replace(
        /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g,
        `<meta name="twitter:image" content="${imageUrl}" />`
      );

      return html;
    },
  };
}

function getDeploymentUrl(): string | null {
  if (process.env.REPLIT_INTERNAL_APP_DOMAIN) {
    const url = `https://${process.env.REPLIT_INTERNAL_APP_DOMAIN}`;
    log('[meta-images] using internal app domain:', url);
    return url;
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    const url = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    log('[meta-images] using dev domain:', url);
    return url;
  }

  return null;
}

function log(...args: any[]): void {
  if (process.env.NODE_ENV === 'production') {
    console.log(...args);
  }
}
