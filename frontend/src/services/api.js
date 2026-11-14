export const API = import.meta.env.VITE_API_URL || "/api";
let csrfToken;
export function setCsrf(value) {
  csrfToken = value;
}
export async function api(path, options = {}) {
  const { body, ...rest } = options;
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      credentials: "include",
      ...rest,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        ...rest.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data.errors?.length
        ? `${data.message} ${data.errors.map((e) => e.message).join(" ")}`
        : data.message || "No pudimos cargar el contenido.",
    );
    error.status = response.status;
    error.fields = data.errors;
    throw error;
  }
  return data;
}
export const queryString = (values) =>
  new URLSearchParams(
    Object.entries(values).filter(([, v]) => v !== "" && v != null),
  ).toString();
