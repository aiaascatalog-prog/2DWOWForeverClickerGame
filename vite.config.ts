import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const portal = (process.env.VITE_PORTAL || '').trim().toLowerCase();
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-portal-sdk',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            let sdkTag = '';
            if (portal === 'crazygames') {
              sdkTag = '    <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n';
            } else if (portal === 'bountyboard') {
              sdkTag = '    <script src="https://www.bountyboard.gg/arcade-sdk/v1.js"></script>\n';
            } else if (portal === 'y8') {
              sdkTag = '    <script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>\n';
            }
            if (!sdkTag) return html;
            return html.replace('</head>', `${sdkTag}  </head>`);
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
