import { Link } from "react-router-dom";
import { useResource } from "../services/useResource";
import { useApp } from "../context/AppContext";
import { Loading, ErrorState, EventGrid, Empty } from "../components/UI";
export default function Saved() {
  const { data, loading, error, reload } = useResource("/favorites"),
    { saved } = useApp();
  const events = data?.events.filter((e) => saved.has(e.id)) || [];
  return (
    <div className="container page">
      <p className="eyebrow">TU PEQUEÑA COLECCIÓN DEL MUNDO</p>
      <h1>Historias para volver.</h1>
      <p className="page-subtitle">
        Tus favoritos se guardan en tu cuenta y te acompañan en cualquier
        dispositivo.
      </p>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : events.length ? (
        <EventGrid events={events} />
      ) : (
        <Empty title="Aquí empieza tu colección">
          <p>Toca el corazón de una historia para guardarla.</p>
          <Link className="btn" to="/explorar">
            Encontrar mi próximo descubrimiento
          </Link>
        </Empty>
      )}
      <p className="muted small">
        Si un evento se retira de publicación, dejará de mostrarse en esta
        colección.
      </p>
    </div>
  );
}
