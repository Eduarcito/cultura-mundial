import { useState } from "react";
import { categories, today } from "./UI";
const empty = {
  title: "",
  country: "",
  city: "",
  category: "Festivales",
  kind: "edition",
  description: "",
  origin: "",
  activities: [],
  venue: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  timezone: "",
  sourceUrl: "",
  dateConfirmed: false,
  access: "unknown",
  accessDetails: "",
  reviewedAt: today(),
  imageUrl: "/images/antigua.webp",
  imageAlt: "Arco de Santa Catalina en Antigua Guatemala. Imagen ilustrativa.",
  imageCredit: "By Topo / Unsplash",
  imageSource:
    "https://unsplash.com/photos/a-clock-tower-with-a-mountain-in-the-background-XOSMdXIWk_I",
  imageLicense: "Unsplash License",
  isDemo: false,
  status: "pending",
  moderationNote: "",
};
export default function EventForm({
  initial,
  admin = false,
  onSubmit,
  submitLabel,
}) {
  const [form, setForm] = useState({ ...empty, ...initial }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const input = (name, label, props = {}) => (
    <label>
      {label}
      <input
        name={name}
        value={form[name] || ""}
        onChange={(e) => set(name, e.target.value)}
        {...props}
      />
    </label>
  );
  const area = (name, label, props = {}) => (
    <label>
      {label}
      <textarea
        name={name}
        value={form[name] || ""}
        onChange={(e) => set(name, e.target.value)}
        rows={4}
        {...props}
      />
    </label>
  );
  async function submit(ev) {
    ev.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="event-form" onSubmit={submit}>
      <fieldset>
        <legend>01 · La historia que quieres compartir</legend>
        {input("title", "Nombre del evento o tradición", {
          required: true,
          minLength: 4,
          maxLength: 180,
        })}
        <div className="form-grid">
          <label>
            Categoría
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Tipo de contenido
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value,
                  ...(e.target.value === "tradition"
                    ? {
                        startDate: "",
                        endDate: "",
                        startTime: "",
                        endTime: "",
                        dateConfirmed: false,
                      }
                    : {}),
                }))
              }
            >
              <option value="edition">Edición con fechas y año</option>
              <option value="tradition">Tradición general, sin edición</option>
            </select>
          </label>
        </div>
        {area("description", "Descripción", {
          required: true,
          minLength: 30,
          maxLength: 10000,
        })}
        {area("origin", "Origen y contexto cultural", { maxLength: 6000 })}
        <label>
          Actividades principales (una por línea)
          <textarea
            rows={3}
            value={form.activities.join("\n")}
            onChange={(e) => set("activities", e.target.value.split("\n"))}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>02 · El lugar y el momento</legend>
        <div className="form-grid">
          {input("country", "País", {
            required: true,
            minLength: 2,
            maxLength: 80,
          })}
          {input("city", "Ciudad o comunidad", {
            required: true,
            minLength: 2,
            maxLength: 100,
          })}
        </div>
        {input("venue", "Lugar de celebración", { maxLength: 250 })}
        {form.kind === "edition" && (
          <>
            <div className="form-grid">
              {input("startDate", "Fecha de inicio", {
                type: "date",
                required: true,
              })}
              {input("endDate", "Fecha de finalización", {
                type: "date",
                required: true,
                min: form.startDate,
              })}
            </div>
            <div className="form-grid">
              {input("startTime", "Hora de inicio (opcional)", {
                type: "time",
              })}
              {input("endTime", "Hora de finalización (opcional)", {
                type: "time",
              })}
            </div>
            {input("timezone", "Zona horaria IANA (si incluyes horarios)", {
              placeholder: "America/Guatemala",
              maxLength: 80,
            })}
          </>
        )}
      </fieldset>
      <fieldset>
        <legend>03 · Una fuente que podamos consultar</legend>
        {input("sourceUrl", "Enlace de referencia u organizador oficial", {
          type: "url",
          required: true,
          maxLength: 2000,
          placeholder: "https://…",
        })}
        <p className="muted small">
          Incluye una fuente verificable. La fecha, el acceso y las imágenes se
          revisan antes de publicar.
        </p>
      </fieldset>
      {admin && (
        <>
          <fieldset>
            <legend>04 · Revisión editorial</legend>
            <div className="form-grid">
              <label>
                Acceso
                <select
                  value={form.access}
                  onChange={(e) => set("access", e.target.value)}
                >
                  <option value="unknown">No confirmado</option>
                  <option value="free">Gratuito confirmado</option>
                  <option value="paid">De pago confirmado</option>
                </select>
              </label>
              {input("reviewedAt", "Fecha de revisión", { type: "date" })}
            </div>
            {input(
              "accessDetails",
              "Información de acceso o precio confirmado",
              { maxLength: 300 },
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.dateConfirmed}
                onChange={(e) => set("dateConfirmed", e.target.checked)}
                disabled={form.kind === "tradition"}
              />{" "}
              Las fechas de esta edición están confirmadas en la fuente
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.isDemo}
                onChange={(e) => set("isDemo", e.target.checked)}
              />{" "}
              Es un ejemplo ficticio
            </label>
            <label>
              Estado
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="pending">Pendiente</option>
                <option value="published">Publicado</option>
                <option value="rejected">Rechazado</option>
                <option value="withdrawn">Retirado</option>
              </select>
            </label>
            {area("moderationNote", "Nota para quien propuso el contenido", {
              maxLength: 1000,
            })}
          </fieldset>
          <fieldset>
            <legend>05 · Fotografía y permisos</legend>
            {input("imageUrl", "URL de la fotografía o ruta local /images/…", {
              required: true,
              maxLength: 2000,
            })}
            {input(
              "imageAlt",
              "Texto alternativo y contexto de la fotografía",
              { required: true, minLength: 5, maxLength: 300 },
            )}
            {input("imageCredit", "Crédito del autor", {
              required: true,
              minLength: 2,
              maxLength: 250,
            })}
            {input("imageSource", "Enlace a la fotografía original", {
              required: true,
              type: "url",
              maxLength: 2000,
            })}
            {input("imageLicense", "Licencia o permiso de uso", {
              required: true,
              minLength: 2,
              maxLength: 300,
            })}
            <p className="muted small">
              Confirma que puedes usar la imagen y conserva su atribución. La
              foto predeterminada es ilustrativa de Guatemala; sustitúyela
              cuando no corresponda.
            </p>
          </fieldset>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn" disabled={busy}>
        {busy
          ? "Guardando…"
          : submitLabel ||
            (admin ? "Guardar cambios" : "Enviar propuesta para revisión")}
      </button>
      {!admin && (
        <p className="muted small">
          Tu propuesta permanecerá privada hasta que el equipo de administración
          la apruebe.
        </p>
      )}
    </form>
  );
}
