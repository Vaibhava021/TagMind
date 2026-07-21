// dev.config.js[web] 
import { mergeConfig } from "vite";
import baseConfig from "./base.config";
import { PATHS } from "../shared/paths";
import { DEV_BUILD } from "../shared/constants";
import { createBuildInfo } from "../shared/build";

export default mergeConfig(baseConfig, {
    define: createBuildInfo("development", "web"),
    build: {
        outDir: PATHS.BUILD.DEV.WEB,
        emptyOutDir: DEV_BUILD.EMPTY_OUT_DIR,
        sourcemap: DEV_BUILD.SOURCE_MAP,
        minify: DEV_BUILD.MINIFY,

        rollupOptions: {
            input: {
                main: PATHS.INDEX_HTML,
            },
        },
    },
});