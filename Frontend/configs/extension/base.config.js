import { defineConfig } from "vite";
import { getExtensionPlugins } from "../shared/plugins";
import { SERVER } from "../shared/constants";

export default defineConfig({
    plugins: getExtensionPlugins(),

    server: {
        host: SERVER.HOST,
        port: SERVER.PORT,
        strictPort: SERVER.STRICT_PORT,
    },
});