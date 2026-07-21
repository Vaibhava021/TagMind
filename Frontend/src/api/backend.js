const API = import.meta.env.VITE_API_BASE_URL;

export async function healthCheck() {
    const response = await fetch(`${API}accounts/health/`, {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Backend Offline");
    }

    return await response.json();
}