const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function postJSON(path, body, token) {
    const res = await fetch(API_BASE + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, data };
    return data;
}

export async function getJSON(path, token) {
    const res = await fetch(API_BASE + path, {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, data };
    return data;
}
