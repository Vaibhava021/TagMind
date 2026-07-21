import { healthCheck } from "./backend";

const RETRY_INTERVAL = 500;
const MAX_WAIT = 30000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBackend() {
    // Phase 4
    // Launcher will be called here
}

export async function ensureBackend(onStatus = () => {}) {
    onStatus("Checking backend...");
    try {
        await healthCheck();
        return;
    }
    catch {}
    await startBackend();
    const start = Date.now();
    let retry = 0;
    while (Date.now() - start < MAX_WAIT) {
        try {
            await healthCheck();
            return;
        }
        catch {
            retry++;
            onStatus(`Retry ${retry}...`);
            await sleep(RETRY_INTERVAL);
        }
    }
    throw new Error("BACKEND_TIMEOUT");
}