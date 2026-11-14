import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  CalendarDays,
  X,
} from "lucide-react";
import { useResource } from "../services/useResource";
import { queryString } from "../services/api";
import {
  categories,
  EventGrid,
  Empty,
  Loading,
  ErrorState,
  Pagination,
  SurpriseButton,
} from "../components/UI";
import Calendar from "../components/Calendar";
export default function Explore() {
  const [params, setParams] = useSearchParams(),
    [q, setQ] = useState(params.get("q") || "");
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  const filters = Object.fromEntries(
    ["q", "country", "category", "from", "to", "kind", "sort", "page"].map(
      (key) => [key, params.get(key) || ""],
    ),
  );
  const calendar = params.get("vista") === "calendario";
  const { data, loading, error, reload } = useResource(
      `/events?${queryString(filters)}`,
    ),
    meta = useResource("/meta");
  useEffect(() => setQ(params.get("q") || ""), [params]);
  function update(key, value) {
    const next = new URLSearchParams(paramsRef.current);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    paramsRef.current = next;
    setParams(next);
  }
  const active = Object.entries(filters).filter(
    ([key, value]) => value && !["page", "sort"].includes(key),
  );
  return (
    <div className="container page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DEJA QUE LA CURIOSIDAD TE GUÍE</p>
          <h1>El mundo te espera.</h1>
          <p>
            Encuentra una celebración, un nuevo sabor o una historia que se
            quede contigo.
          </p>
        </div>
        <SurpriseButton />
      </div>
      <div className="explore-layout">
        <aside className="filters">
          <h2>
            <SlidersHorizontal size={18} /> A tu manera
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update("q", q);
            }}
          >
            <label htmlFor="explore-q">Buscar una historia</label>
            <div className="filter-search">
              <input
                id="explore-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, ciudad, tradición…"
                maxLength={120}
              />
              <button className="icon-btn" aria-label="Aplicar búsqueda">
                <Search size={18} />
              </button>
            </div>
          </form>
          <label>
            País
            <select
              value={filters.country}
              onChange={(e) => update("country", e.target.value)}
            >
              <option value="">Todos los países</option>
              {(meta.data?.countries || []).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Categoría
            <select
              value={filters.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>¿Cuándo quieres descubrir?</legend>
            <label>
              Desde
              <input
                type="date"
                value={filters.from}
                onChange={(e) => update("from", e.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                min={filters.from}
                value={filters.to}
                onChange={(e) => update("to", e.target.value)}
              />
            </label>
          </fieldset>
          <label>
            Tipo de contenido
            <select
              value={filters.kind}
              onChange={(e) => update("kind", e.target.value)}
            >
              <option value="">Ediciones y tradiciones</option>
              <option value="edition">Ediciones con fecha</option>
              <option value="tradition">Tradiciones generales</option>
            </select>
          </label>
          <button
            className="text-link clear-filters"
            onClick={() => {
              setParams(calendar ? { vista: "calendario" } : {});
              setQ("");
            }}
          >
            <X size={15} /> Limpiar filtros
          </button>
          {meta.error && (
            <p className="form-error" role="alert">
              {meta.error}
            </p>
          )}
        </aside>
        <section
          className="explore-results"
          aria-label="Resultados de exploración"
        >
          <div className="results-toolbar">
            <span>
              {calendar
                ? "Tu calendario cultural"
                : loading
                  ? "Buscando…"
                  : `${data?.total || 0} ${data?.total === 1 ? "historia" : "historias"} por descubrir`}
            </span>
            <div className="view-toggle">
              <button
                className={!calendar ? "active" : ""}
                aria-label="Vista de tarjetas"
                aria-pressed={!calendar}
                onClick={() => update("vista", "")}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={calendar ? "active" : ""}
                aria-label="Vista de calendario"
                aria-pressed={calendar}
                onClick={() => update("vista", "calendario")}
              >
                <CalendarDays size={18} />
              </button>
            </div>
          </div>
          {active.length > 0 && (
            <div className="active-filters">
              {active.map(([key, value]) => (
                <button key={key} onClick={() => update(key, "")}>
                  {key === "from" ? "Desde " : key === "to" ? "Hasta " : ""}
                  {value === "edition"
                    ? "Ediciones"
                    : value === "tradition"
                      ? "Tradiciones"
                      : value}
                  <X size={13} />
                  <span className="sr-only">Quitar filtro</span>
                </button>
              ))}
            </div>
          )}
          {!calendar && (
            <label className="sort-control">
              Ordenar por
              <select
                value={filters.sort || "date"}
                onChange={(e) => update("sort", e.target.value)}
              >
                <option value="date">Fecha más próxima</option>
                <option value="title">Nombre A–Z</option>
              </select>
            </label>
          )}
          {calendar ? (
            <Calendar key={`${filters.from}-${filters.to}`} filters={filters} />
          ) : loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} retry={reload} />
          ) : data.events.length ? (
            <>
              <EventGrid events={data.events} />
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(p) => update("page", String(p))}
              />
            </>
          ) : (
            <Empty title="La curiosidad no tiene límites">
              <p>
                No encontramos eventos con esta combinación. Prueba otro país o
                amplía las fechas.
              </p>
              <button className="btn" onClick={() => setParams({})}>
                Limpiar filtros
              </button>
            </Empty>
          )}
        </section>
      </div>
    </div>
  );
}
