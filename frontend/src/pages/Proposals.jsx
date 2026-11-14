import { Link, useNavigate } from "react-router-dom";
import { useResource } from "../services/useResource";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import EventForm from "../components/EventForm";
import { Loading, ErrorState, Empty, dateLabel } from "../components/UI";
export const statuses = {
  pending: "Pendiente de revisión",
  published: "Publicado",
  rejected: "Rechazado",
  withdrawn: "Retirado",
};
export function Propose() {
  const navigate = useNavigate(),
    { notify } = useApp();
  return (
    <div className="container page narrow">
      <p className="eyebrow">TU COMUNIDAD TIENE MUCHO QUE CONTAR</p>
      <h1>Comparte un encuentro.</h1>
      <p className="page-subtitle">
        Ayúdanos a descubrir una celebración o tradición. Revisaremos el
        contenido y su fuente antes de publicarlo.
      </p>
      <EventForm
        onSubmit={async (form) => {
          await api("/proposals", {
            method: "POST",
            body: {
              ...form,
              activities: form.activities.filter((a) => a.trim()),
            },
          });
          notify("Propuesta enviada. Puedes consultar aquí su estado.");
          navigate("/propuestas");
        }}
      />
    </div>
  );
}
export function Proposals() {
  const { data, loading, error, reload } = useResource("/proposals");
  return (
    <div className="container page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">HISTORIAS QUE APORTAS</p>
          <h1>Mis propuestas</h1>
        </div>
        <Link className="btn" to="/proponer">
          Nueva propuesta
        </Link>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data.events.length ? (
        <div className="proposal-list">
          {data.events.map((e) => (
            <article className="proposal" key={e.id}>
              <div>
                <span className={`status ${e.status}`}>
                  {statuses[e.status]}
                </span>
                <h2>{e.title}</h2>
                <p>
                  {e.city}, {e.country} · {dateLabel(e.startDate)}
                </p>
                <p className="muted">
                  {e.moderationNote ||
                    "Recibirás aquí el resultado de la revisión editorial."}
                </p>
              </div>
              {e.status === "published" && (
                <Link className="text-link" to={`/eventos/${e.id}`}>
                  Ver publicación →
                </Link>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty title="Tu primera historia está por llegar">
          <p>¿Conoces un encuentro cultural que merece compartirse?</p>
          <Link className="btn" to="/proponer">
            Proponer un evento
          </Link>
        </Empty>
      )}
    </div>
  );
}
