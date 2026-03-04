import path from 'path';
import { execSync } from 'child_process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
var commitHash = (function () {
    var sha = process.env.VITE_COMMIT_HASH || process.env.GITHUB_SHA;
    if (sha)
        return sha.slice(0, 7);
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    }
    catch (_a) {
        return 'dev';
    }
})();
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), 'VITE_');
    var base = process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/puipui-client/' : '/');
    return {
        base: base,
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'autoUpdate',
                workbox: {
                    clientsClaim: true,
                    skipWaiting: true,
                    navigateFallback: 'index.html',
                    navigateFallbackDenylist: [/^\/api\//],
                },
                manifest: {
                    name: 'PuiPui',
                    short_name: 'PuiPui',
                    start_url: base,
                    scope: base,
                    display: 'standalone',
                    orientation: 'portrait',
                    background_color: '#ffffff',
                    theme_color: '#ffffff',
                    icons: [
                        { src: 'puipui-192x192.png', sizes: '192x192', type: 'image/png' },
                        { src: 'puipui-512x512.png', sizes: '512x512', type: 'image/png' },
                    ],
                },
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        define: {
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
            'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(commitHash),
        },
        server: {
            port: 5173,
        },
    };
});
