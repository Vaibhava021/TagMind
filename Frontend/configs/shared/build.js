import { version } from "../../package.json";

export function createBuildInfo(mode, target) {
    return {
        __APP_VERSION__: JSON.stringify(version),
        __BUILD_MODE__: JSON.stringify(mode),
        __BUILD_TARGET__: JSON.stringify(target),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    };
}