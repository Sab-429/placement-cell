const API_BASE = "http://localhost:8000/api";

export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "Registration failed");
  }

  return result;
}

export async function loginUser(data) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "Login failed");
  }
  return result;
}
