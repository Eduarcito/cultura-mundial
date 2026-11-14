import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Plus,
  FileCheck2,
  Shield,
  LogOut,
  ArrowRight,
  Globe2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Loading, ErrorState } from "../components/UI";
export default function Account() {
  const {
      user,
      ready,
      sessionError,
      refreshSession,
      authenticate,
      logout,
      notify,
    } = useApp(),
    [mode, setMode] = useState("login"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    navigate = useNavigate(),
    location = useLocation();
  if (!ready) return <Loading />;
  if (sessionError)
    return <ErrorState message={sessionError} retry={refreshSession} />;
  if (user)
    return (
      <div className="container page account-page">
        <p className="eyebrow">TU PASAPORTE CULTURAL</p>
        <h1>Hola, {user.name}.</h1>
        <p className="muted">
          Un lugar para guardar lo que te mueve y compartir lo que conoces.
        </p>
        <div className="account-grid">
          {[
            [
              Heart,
              "Mis guardados",
              "Tus historias favoritas, siempre a mano.",
              "/guardados",
            ],
            [
              Plus,
              "Proponer un evento",
              "Acerca tu comunidad al mundo.",
              "/proponer",
            ],
            [
              FileCheck2,
              "Mis propuestas",
              "Consulta su estado y la revisión editorial.",
              "/propuestas",
            ],
            ...(user.role === "admin"
              ? [
                  [
                    Shield,
                    "Administración",
                    "Revisa y gestiona el contenido publicado.",
                    "/admin",
                  ],
                ]
              : []),
          ].map(([Icon, title, text, to]) => (
            <Link className="account-tile" key={to} to={to}>
              <Icon />
              <h2>{title}</h2>
              <p>{text}</p>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
        <button
          disabled={busy}
          className="btn secondary"
          onClick={async () => {
            setBusy(true);
            try {
              await logout();
            } catch (e) {
              notify(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <LogOut size={17} /> Cerrar sesión
        </button>
      </div>
    );
  async function submit(ev) {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(ev.currentTarget));
    try {
      await authenticate(mode, body);
      const from = location.state?.from;
      navigate(
        from?.startsWith("/") && !from.startsWith("//") ? from : "/cuenta",
        { replace: true },
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout container page">
      <div className="auth-story">
        <Globe2 size={45} strokeWidth={1} />
        <p className="eyebrow">LA CURIOSIDAD NOS UNE</p>
        <h1>
          Un mundo de historias.
          <br />
          <em>Tu lugar en él.</em>
        </h1>
        <p>
          Guarda tus próximos descubrimientos y comparte los encuentros que
          hacen única a tu comunidad.
        </p>
        <span>Explora · Conecta · Comparte</span>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Iniciar sesión
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Crear cuenta
          </button>
        </div>
        <h2>
          {mode === "login"
            ? "Qué bueno verte por aquí."
            : "La próxima historia empieza contigo."}
        </h2>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Tu nombre
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 12 : 1}
              maxLength={72}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
            />
          </label>
          {mode === "register" && (
            <small>
              Usa al menos 12 caracteres. Evita contraseñas que ya uses en otros
              sitios.
            </small>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn" disabled={busy}>
            {busy
              ? "Un momento…"
              : mode === "login"
                ? "Entrar"
                : "Crear mi cuenta"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="auth-footnote">
          Puedes explorar todas las historias sin crear una cuenta.
        </p>
      </div>
    </div>
  );
}
