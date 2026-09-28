const BASE_URL = "http://localhost:5555";

export async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Essential for passing Flask session cookies
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}