import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "../../manifest.json";

/**
 * for web application.
 */
export function getWebPlugins() {
    return [
        react(),
        tailwindcss(),
    ];
}

/**
 * for Chrome extension.
 */
export function getExtensionPlugins() {
    return [
        react(),
        crx({
            manifest,
        }),
        tailwindcss(),
    ];
}   