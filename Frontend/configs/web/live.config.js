// live.config.js[web] 
import { mergeConfig } from "vite";
import baseConfig from "./base.config";
import { PATHS } from "../shared/paths";
import { LIVE_BUILD } from "../shared/constants";
import { createBuildInfo } from "../shared/build";

export default mergeConfig(baseConfig, {
    define: createBuildInfo("production", "web"),
    build: {
        outDir: PATHS.BUILD.LIVE.WEB,
        emptyOutDir: LIVE_BUILD.EMPTY_OUT_DIR,

        rollupOptions: {
            input: {
                main: PATHS.INDEX_HTML,
            },
        },
    },
});