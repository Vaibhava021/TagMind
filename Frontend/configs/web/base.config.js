import { defineConfig } from "vite";
import { PATHS } from "../shared/paths";
import { getWebPlugins } from "../shared/plugins";

export default defineConfig({
    root: PATHS.ROOT,

    plugins: getWebPlugins(),
});