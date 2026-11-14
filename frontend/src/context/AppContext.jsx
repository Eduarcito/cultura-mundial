import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api, setCsrf } from "../services/api";
const Context = createContext(null);
export function AppProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [sessionError, setSessionError] = useState("");
  const [saved, setSaved] = useState(new Set()),
    [toast, setToast] = useState("");
  const notify = useCallback((message) => setToast(message), []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const refreshSaved = useCallback(async () => {
    const data = await api("/favorites");
    setSaved(new Set(data.events.map((e) => e.id)));
  }, []);
  async function refreshSession() {
    setSessionError("");
    try {
      const data = await api("/auth/session");
      setUser(data.user);
      setCsrf(data.csrfToken);
      if (data.user) await refreshSaved();
      else setSaved(new Set());
    } catch (e) {
      setSessionError(e.message);
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    refreshSession();
  }, []);
  async function authenticate(mode, body) {
    const data = await api(`/auth/${mode}`, { method: "POST", body });
    setUser(data.user);
    setCsrf(data.csrfToken);
    await refreshSaved();
    return data.user;
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    setSaved(new Set());
    await refreshSession();
    notify("Has cerrado sesión.");
  }
  async function toggleFavorite(id) {
    const exists = saved.has(id);
    await api(`/favorites/${id}`, { method: exists ? "DELETE" : "PUT" });
    setSaved((prev) => {
      const next = new Set(prev);
      exists ? next.delete(id) : next.add(id);
      return next;
    });
    notify(
      exists
        ? "Eliminado de tus guardados."
        : "Guardado para tu próxima aventura.",
    );
  }
  return (
    <Context.Provider
      value={{
        user,
        ready,
        sessionError,
        refreshSession,
        authenticate,
        logout,
        saved,
        toggleFavorite,
        notify,
      }}
    >
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="toast">
            {toast}
            <button onClick={() => setToast("")} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
