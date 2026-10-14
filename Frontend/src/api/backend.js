
const API = import.meta.env.VITE_API_BASE_URL;

export async function healthCheck() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
        const response = await fetch(`${API}accounts/health/`, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error("Backend Offline");
        }

        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}
