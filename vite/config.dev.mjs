import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: './',
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        phaser: ['phaser']
                    }
                }
            },
        },
        server: {
            port: 8080,
            allowedHosts: env.EXTRA_HOSTS
                ? ['localhost'].concat(env.EXTRA_HOSTS.split(','))
                : ['localhost']
        }
    };
});
