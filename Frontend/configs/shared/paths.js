import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");

export const PATHS = {
    ROOT,
    INDEX_HTML: resolve(ROOT, "index.html"),
    MANIFEST: resolve(ROOT, "manifest.json"),
    PUBLIC: resolve(ROOT, "public"),
    SRC: resolve(ROOT, "src"),
    BUILD: {
        LIVE: {
            WEB: resolve(ROOT, "build/live/web"),
            EXT: resolve(ROOT, "build/live/ext"),
        },
        DEV: {
            WEB: resolve(ROOT, "build/dev/web"),
            EXT: resolve(ROOT, "build/dev/ext"),
        }
    }

};