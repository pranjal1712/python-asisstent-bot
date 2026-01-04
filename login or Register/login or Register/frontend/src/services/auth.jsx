// Keys for localStorage
const ACCESS_KEY = "pb_access_token";
const REFRESH_KEY = "pb_refresh_token";
const USER_KEY = "pb_user";

// Save auth data from backend response
export function saveAuthFromResponse(data) {
    if (data?.access_token) {
        localStorage.setItem(ACCESS_KEY, data.access_token);
    }
    if (data?.refresh_token) {
        localStorage.setItem(REFRESH_KEY, data.refresh_token);
    }
    if (data?.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
}

// Save manually (if needed)
export function saveAuth(access, refresh, user) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Getters
export function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
}

export function getUser() {
    const v = localStorage.getItem(USER_KEY);
    return v ? JSON.parse(v) : null;
}

// Clear
export function clearAuth() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}
