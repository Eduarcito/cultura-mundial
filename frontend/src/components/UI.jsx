import {
  ArrowRight,
  Heart,
  MapPin,
  CalendarDays,
  Search,
  Sparkles,
  LoaderCircle,
  Globe2,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
export const categories = [
  "Festivales",
  "Gastronomía",
  "Música y danza",
  "Arte",
  "Tradiciones",
  "Celebraciones",
];
export function dateLabel(value, options = {}) {
  return value
    ? new Intl.DateTimeFormat("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...options,
      }).format(new Date(`${value}T12:00:00`))
    : "Tradición viva · sin fecha específica";
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function Image({ src, alt, className = "", eager = false, ...props }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className={`image-fallback ${className}`} role="img" aria-label={alt}>
      <Globe2 size={44} />
      <span>Una historia por descubrir</span>
    </div>
  ) : (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
export function Loading() {
  return (
    <div className="state" role="status">
      <LoaderCircle className="spin" /> Cargando nuevas historias…
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="state error" role="alert">
      <h3>No pudimos cargar esta página</h3>
      <p>{message}</p>
      {retry && (
        <button className="btn secondary" onClick={retry}>
          Volver a intentar
        </button>
      )}
    </div>
  );
}
export function Empty({ title = "Todavía no hay historias aquí", children }) {
  return (
    <div className="state empty">
      <Globe2 size={38} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function SectionHeading({ eyebrow, title, link, to }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {link && (
        <Link className="text-link" to={to}>
          {link}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function SearchBox({ initial = "", compact = false }) {
  const [q, setQ] = useState(initial);
  const navigate = useNavigate();
  return (
    <form
      className={`search-box ${compact ? "compact" : ""}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/explorar?q=${encodeURIComponent(q)}`);
      }}
    >
      <Search size={21} />
      <label
        className="sr-only"
        htmlFor={compact ? "nav-search" : "hero-search"}
      >
        Buscar evento, país, ciudad o tradición
      </label>
      <input
        id={compact ? "nav-search" : "hero-search"}
        placeholder={
          compact
            ? "¿Qué quieres descubrir?"
            : "Evento, país, ciudad o tradición…"
        }
        value={q}
        onChange={(e) => setQ(e.target.value)}
        maxLength={120}
      />
      <button aria-label="Buscar" className={compact ? "icon-btn" : "btn"}>
        {compact ? <ArrowRight size={18} /> : "Explorar"}
      </button>
    </form>
  );
}
export function SaveButton({ event, full = false }) {
  const { user, saved, toggleFavorite, notify } = useApp();
  const navigate = useNavigate(),
    location = useLocation();
  const [busy, setBusy] = useState(false);
  const active = saved.has(event.id);
  return (
    <button
      className={
        full ? "btn secondary" : `save-button ${active ? "active" : ""}`
      }
      aria-label={`${active ? "Quitar" : "Guardar"} ${event.title}`}
      aria-pressed={active}
      disabled={busy}
      onClick={async () => {
        if (!user)
          return navigate("/cuenta", {
            state: { from: location.pathname + location.search },
          });
        setBusy(true);
        try {
          await toggleFavorite(event.id);
        } catch (e) {
          notify(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Heart size={19} fill={active ? "currentColor" : "none"} />
      {full && (active ? "Guardado" : "Guardar evento")}
    </button>
  );
}
export function EventCard({ event }) {
  const local = event.imageUrl?.startsWith("/images/");
  return (
    <article className="event-card">
      <div className="card-image">
        <Link to={`/eventos/${event.id}`} tabIndex={-1} aria-hidden="true">
          <Image
            src={
              local
                ? event.imageUrl.replace(".webp", "-small.webp")
                : event.imageUrl
            }
            alt={event.imageAlt}
          />
        </Link>
        <span className="category-tag">{event.category}</span>
        <SaveButton event={event} />
      </div>
      <div className="card-content">
        <p className="location">
          <MapPin size={13} />
          {event.city}, {event.country}
        </p>
        <h3>
          <Link to={`/eventos/${event.id}`}>{event.title}</Link>
        </h3>
        <p className="card-description">{event.description}</p>
        <div className="card-bottom">
          <span>
            <CalendarDays size={15} />
            {dateLabel(event.startDate)}
          </span>
          <ArrowRight size={17} />
        </div>
        <div className="card-note">
          {event.isDemo
            ? "Ejemplo ficticio · fechas ilustrativas"
            : event.kind === "tradition"
              ? "Historia cultural documentada"
              : event.dateConfirmed
                ? "Fecha confirmada"
                : "Fecha por confirmar"}
        </div>
      </div>
    </article>
  );
}
export function EventGrid({ events }) {
  return (
    <div className="event-grid">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
export function SurpriseButton({ className = "btn secondary" }) {
  const [busy, setBusy] = useState(false),
    navigate = useNavigate();
  const { notify } = useApp();
  return (
    <button
      disabled={busy}
      className={className}
      onClick={async () => {
        setBusy(true);
        try {
          const event = await api("/events/surprise");
          navigate(`/eventos/${event.id}`);
        } catch (e) {
          notify(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Sparkles size={17} />
      {busy ? "Buscando…" : "Sorpréndeme"}
    </button>
  );
}
export function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        className="btn secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </button>
      <span>
        Página {page} de {pages}
      </span>
      <button
        className="btn secondary"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
