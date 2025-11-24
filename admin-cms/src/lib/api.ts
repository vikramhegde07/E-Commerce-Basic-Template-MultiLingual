import axios, { type AxiosInstance } from "axios";
import { getCurrentLocale } from "@/lib/lang"; // helper we'll define below

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const client: AxiosInstance = axios.create({
    baseURL: API_BASE,
    withCredentials: false,
});

// Attach token + locale
client.interceptors.request.use(config => {
    // --- Auth token ---
    const token = window.localStorage.getItem("user_token");
    if (token) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${token}`;
    }

    // --- Locale injection ---
    try {
        const locale = getCurrentLocale(); // 'en' | 'ar' | 'zh'
        if (locale) {
            if (config.method === "get" || config.method === "delete") {
                // append ?locale=xx safely
                const hasQuery = config.url?.includes("?");
                config.url = `${config.url}${hasQuery ? "&" : "?"}locale=${encodeURIComponent(locale)}`;
            } else if (config.method === "post" || config.method === "put" || config.method === "patch") {
                // For form-data or JSON payloads
                if (config.data instanceof FormData) {
                    config.data.append("locale", locale);
                } else if (typeof config.data === "object" && config.data !== null) {
                    config.data = { ...config.data, locale };
                } else {
                    // no data? just create it
                    config.data = { locale };
                }
            }
        }
    } catch {
        // silently ignore if context unavailable (e.g., before React mounts)
    }

    return config;
});

// Handle 401 globally
client.interceptors.response.use(
    res => res,
    err => {
        if (err?.response?.status === 401) {
            window.localStorage.removeItem("user_token");
            window.localStorage.removeItem("userData");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

export default client;
