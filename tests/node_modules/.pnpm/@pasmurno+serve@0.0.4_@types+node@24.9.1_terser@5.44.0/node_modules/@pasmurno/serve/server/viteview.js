import { join, resolve } from 'node:path';
import { preview } from 'vite';
const __dirname = resolve();
export default async function server({ port, dist, host, } = {}) {
    if (!port) {
        port = 3000;
    }
    if (dist) {
        dist = resolve(__dirname, dist);
    }
    else {
        dist = join(__dirname, 'dist');
    }
    if (host === undefined) {
        host = undefined;
    }
    else if (host) {
        host = true;
    }
    else {
        host = false;
    }
    const previewServer = await preview({
        // any valid user config options, plus `mode` and `configFile`
        mode: 'development',
        build: {
            outDir: dist,
        },
        preview: {
            port,
            open: false,
            host,
        },
    });
    // Root log
    console.log('  ➜  Root:   ', dist);
    previewServer.printUrls();
    previewServer.bindCLIShortcuts({ print: true });
}
