import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useResource } from "../services/useResource";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import { Loading, ErrorState, Empty, Pagination } from "../components/UI";
import EventForm from "../components/EventForm";
import { statuses } from "./Proposals";
export function Admin() {
  const [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [review, setReview] = useState(null),
    [note, setNote] = useState("");
  const { data, loading, error, reload } = useResource(
      `/admin/events?status=${status}&page=${page}&limit=12`,
    ),
    { notify } = useApp();
  async function mutate(path, body) {
    setBusy(true);
    try {
      const data = await api(path, { method: body ? "PATCH" : "POST", body });
      notify(data.message || "Estado actualizado.");
      setReview(null);
      setConfirm(false);
      reload();
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUIDAMOS LAS HISTORIAS QUE COMPARTIMOS</p>
          <h1>Mesa editorial</h1>
        </div>
        <Link className="btn" to="/admin/nuevo">
          Crear contenido
        </Link>
      </div>
      <div className="admin-toolbar">
        <label>
          Mostrar
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            {Object.entries(statuses).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn secondary" onClick={() => setConfirm(!confirm)}>
          Retirar ejemplos ficticios
        </button>
      </div>
      {confirm && (
        <div className="notice">
          <p>
            Se retirarán del sitio público todos los ejemplos ficticios. Podrás
            volver a publicarlos individualmente.
          </p>
          <button
            className="btn"
            disabled={busy}
            onClick={() => mutate("/admin/withdraw-demo")}
          >
            Confirmar retirada de ejemplos
          </button>
          <button className="btn secondary" onClick={() => setConfirm(false)}>
            Cancelar
          </button>
        </div>
      )}
      {review && (
        <form
          className="review-box"
          onSubmit={(ev) => {
            ev.preventDefault();
            mutate(`/admin/events/${review.id}/status`, {
              status: review.status,
              moderationNote: note,
            });
          }}
        >
          <h2>
            {review.status === "published"
              ? "Aprobar"
              : review.status === "rejected"
                ? "Rechazar"
                : "Retirar"}
            : {review.title}
          </h2>
          <p>
            {review.status === "published"
              ? "Al aprobar confirmas que revisaste la fuente y los créditos. Las fechas seguirán marcadas como no confirmadas hasta que las verifiques en el editor."
              : "Este contenido no aparecerá en el sitio público."}
          </p>
          <label>
            Nota para la persona que lo propuso
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
            />
          </label>
          <div className="button-row">
            <button className="btn" disabled={busy}>
              Confirmar
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => setReview(null)}
            >
              Cancelar
            </button>
            <Link className="text-link" to={`/admin/editar/${review.id}`}>
              Revisar ficha completa
            </Link>
          </div>
        </form>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data.events.length ? (
        <>
          <div className="admin-list">
            {data.events.map((e) => (
              <article key={e.id}>
                <div>
                  <span className={`status ${e.status}`}>
                    {statuses[e.status]}
                  </span>
                  {e.isDemo && <span className="status">Ejemplo</span>}
                  <h2>{e.title}</h2>
                  <p>
                    {e.country} · {e.category}
                  </p>
                </div>
                <div className="admin-actions">
                  <Link className="btn secondary" to={`/admin/editar/${e.id}`}>
                    Revisar / editar
                  </Link>
                  {e.status !== "published" && (
                    <button
                      className="text-link"
                      onClick={() => {
                        setReview({ ...e, status: "published" });
                        setNote("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Aprobar
                    </button>
                  )}
                  {e.status === "pending" && (
                    <button
                      className="text-link danger"
                      onClick={() => {
                        setReview({ ...e, status: "rejected" });
                        setNote("");
                      }}
                    >
                      Rechazar
                    </button>
                  )}
                  {e.status === "published" && (
                    <button
                      className="text-link danger"
                      onClick={() => {
                        setReview({ ...e, status: "withdrawn" });
                        setNote("");
                      }}
                    >
                      Retirar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      ) : (
        <Empty title="La mesa está al día">
          <p>No hay contenido con este estado.</p>
        </Empty>
      )}
    </div>
  );
}
export function AdminEdit() {
  const { id } = useParams();
  return id ? <ExistingEditor id={id} /> : <Editor />;
}
function ExistingEditor({ id }) {
  const { data, loading, error, reload } = useResource(`/admin/events/${id}`);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;
  return <Editor initial={data.event} />;
}
function Editor({ initial }) {
  const navigate = useNavigate(),
    { notify } = useApp();
  return (
    <div className="container page narrow">
      <Link className="text-link" to="/admin">
        ← Volver a administración
      </Link>
      <h1>{initial ? "Editar historia" : "Una nueva historia"}</h1>
      <EventForm
        admin
        initial={initial}
        onSubmit={async (form) => {
          await api(initial ? `/admin/events/${initial.id}` : "/admin/events", {
            method: initial ? "PUT" : "POST",
            body: {
              ...form,
              activities: form.activities.filter((a) => a.trim()),
            },
          });
          notify("Contenido guardado.");
          navigate("/admin");
        }}
      />
    </div>
  );
}
