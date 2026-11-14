import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Clock3,
  ExternalLink,
  Share2,
  Download,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useState } from "react";
import { useResource } from "../services/useResource";
import { API } from "../services/api";
import {
  Image,
  Loading,
  ErrorState,
  SaveButton,
  SectionHeading,
  EventGrid,
  dateLabel,
} from "../components/UI";
import { useApp } from "../context/AppContext";
export default function Detail() {
  const { id } = useParams(),
    { data, loading, error, reload } = useResource(`/events/${id}`),
    { notify } = useApp(),
    [shareFallback, setShareFallback] = useState("");
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="container page">
        <ErrorState message={error} retry={reload} />
        <Link to="/explorar">Volver a explorar</Link>
      </div>
    );
  const { event: e, related } = data;
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: e.title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        notify("Enlace copiado. Compártelo con alguien curioso.");
      }
    } catch (err) {
      if (err.name !== "AbortError") setShareFallback(window.location.href);
    }
  }
  return (
    <article className="container page detail">
      <Link className="text-link back-link" to="/explorar">
        <ArrowLeft size={16} /> Volver a explorar
      </Link>
      <p className="eyebrow">
        {e.country} · {e.category} ·{" "}
        {e.kind === "tradition"
          ? "TRADICIÓN VIVA"
          : "EDICIÓN " + e.startDate?.slice(0, 4)}
      </p>
      <h1>{e.title}</h1>
      <p className="detail-location">
        <MapPin size={18} />
        {e.city}, {e.country}
      </p>
      <figure className="detail-figure">
        <Image src={e.imageUrl} alt={e.imageAlt} eager />
        <figcaption>
          {e.imageAlt}{" "}
          <a href={e.imageSource} target="_blank" rel="noreferrer">
            {e.imageCredit}
          </a>{" "}
          · {e.imageLicense}
        </figcaption>
      </figure>
      <div className="detail-layout">
        <div className="detail-body">
          {e.isDemo && (
            <div className="notice">
              <strong>Evento ficticio de demostración</strong>
              <p>
                Esta ficha y sus fechas son ejemplos para probar la plataforma.
                No es una convocatoria real.
              </p>
            </div>
          )}
          {!e.dateConfirmed && e.kind === "edition" && !e.isDemo && (
            <div className="notice">
              <strong>Fechas pendientes de confirmación</strong>
              <p>Consulta la fuente antes de planificar tu visita.</p>
            </div>
          )}
          <h2>
            {e.kind === "tradition"
              ? "Una historia que sigue viva"
              : "El encuentro"}
          </h2>
          <p className="prose">{e.description}</p>
          <h2>Origen y contexto cultural</h2>
          <p className="prose">
            {e.origin ||
              "El contexto cultural está pendiente de documentación editorial."}
          </p>
          <h2>Una mirada más cerca</h2>
          {e.activities.length ? (
            <ul className="activities">
              {e.activities.map((a, i) => (
                <li key={i}>
                  <Check size={17} />
                  {a}
                </li>
              ))}
            </ul>
          ) : (
            <p>Las actividades todavía no están confirmadas.</p>
          )}
          <div className="source-box">
            <p className="eyebrow">INFORMACIÓN CON CONTEXTO</p>
            <a
              className="text-link"
              href={e.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {e.isDemo
                ? "Referencia visual del ejemplo"
                : "Consultar la fuente oficial"}
              <ExternalLink size={15} />
            </a>
            <p>
              Última revisión editorial:{" "}
              {e.reviewedAt ? dateLabel(e.reviewedAt) : "pendiente"}.
            </p>
            <small>
              El contenido se revisa manualmente. No se consulta la fuente en
              tiempo real; si no está disponible, esta ficha conserva su última
              revisión.
            </small>
          </div>
        </div>
        <aside className="event-info">
          <p className="eyebrow">PARA TU PRÓXIMO DESCUBRIMIENTO</p>
          <h3>
            {e.kind === "tradition"
              ? "Una tradición, muchas historias"
              : "Los detalles del encuentro"}
          </h3>
          <div className="info-row">
            <CalendarDays />
            <div>
              <strong>
                {e.kind === "tradition"
                  ? "Sin edición concreta"
                  : dateLabel(e.startDate)}
              </strong>
              {e.kind === "edition" && (
                <span>
                  Hasta el {dateLabel(e.endDate)}
                  <br />
                  {e.isDemo
                    ? "Fechas ilustrativas"
                    : e.dateConfirmed
                      ? "Fechas confirmadas"
                      : "Fechas por confirmar"}
                </span>
              )}
            </div>
          </div>
          <div className="info-row">
            <Clock3 />
            <div>
              <strong>
                {e.startTime
                  ? `${e.startTime} – ${e.endTime}`
                  : "Horario no disponible"}
              </strong>
              <span>{e.timezone || "Zona horaria no informada"}</span>
            </div>
          </div>
          <div className="info-row">
            <MapPin />
            <div>
              <strong>{e.city}</strong>
              <span>{e.venue || "Sin sede específica"}</span>
            </div>
          </div>
          <p className="access-label">
            {e.access === "free"
              ? "Acceso gratuito confirmado"
              : e.access === "paid"
                ? "Acceso de pago confirmado"
                : "Información de acceso no confirmada"}
          </p>
          {e.accessDetails && <p>{e.accessDetails}</p>}
          <SaveButton full event={e} />
          <button className="btn secondary" onClick={share}>
            <Share2 size={17} /> Compartir historia
          </button>
          {shareFallback && (
            <label>
              Copia este enlace
              <input
                value={shareFallback}
                readOnly
                onFocus={(ev) => ev.target.select()}
              />
            </label>
          )}
          {e.kind === "edition" && (
            <a
              className="text-link download-link"
              href={`${API}/events/${e.id}/calendar`}
              download
            >
              <Download size={17} /> Descargar calendario (.ics)
            </a>
          )}
        </aside>
      </div>
      {related.length > 0 && (
        <section className="section">
          <SectionHeading
            eyebrow="SIGUE EL HILO"
            title="Historias que conectan"
          />
          <EventGrid events={related} />
        </section>
      )}
    </article>
  );
}
