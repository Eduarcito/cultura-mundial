import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { queryString } from "../services/api";
import { EventGrid, Empty, ErrorState, Loading, dateLabel } from "./UI";
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export default function Calendar({ filters }) {
  const [month, setMonth] = useState(
    () =>
      new Date((filters.from || iso(new Date())).slice(0, 7) + "-01T12:00:00"),
  );
  const [selected, setSelected] = useState("");
  const first = iso(new Date(month.getFullYear(), month.getMonth(), 1)),
    last = iso(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const from = filters.from && filters.from > first ? filters.from : first,
    to = filters.to && filters.to < last ? filters.to : last;
  const outside = from > to || filters.kind === "tradition";
  // Fetch every page, because a calendar must not silently drop events after the first 100.
  const resource = useCalendarEvents({
    ...filters,
    from: outside ? first : from,
    to: outside ? last : to,
    kind: "edition",
  });
  const events = outside ? [] : resource.data || [];
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    offset =
      (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const onDay = (value) =>
    value < from || value > to
      ? []
      : events.filter((e) => e.startDate <= value && e.endDate >= value);
  const agenda = selected ? onDay(selected) : events;
  function move(n) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
    setSelected("");
  }
  return (
    <div className="calendar">
      <div className="calendar-heading">
        <button
          className="icon-btn"
          aria-label="Mes anterior"
          onClick={() => move(-1)}
        >
          <ChevronLeft />
        </button>
        <h2>
          {new Intl.DateTimeFormat("es", {
            month: "long",
            year: "numeric",
          }).format(month)}
        </h2>
        <button
          className="icon-btn"
          aria-label="Mes siguiente"
          onClick={() => move(1)}
        >
          <ChevronRight />
        </button>
      </div>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.reload} />
      ) : (
        <>
          <div className="calendar-grid">
            <div className="weekdays">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="month-days">
              {Array.from({ length: offset }, (_, i) => (
                <span className="day-blank" key={`blank-${i}`} />
              ))}
              {Array.from({ length: days }, (_, i) => {
                const value = `${first.slice(0, 8)}${String(i + 1).padStart(2, "0")}`,
                  list = onDay(value);
                return (
                  <button
                    key={value}
                    className={`day ${selected === value ? "selected" : ""} ${list.length ? "has-events" : ""}`}
                    aria-label={`${dateLabel(value)}: ${list.length} eventos`}
                    aria-pressed={selected === value}
                    onClick={() => setSelected(selected === value ? "" : value)}
                  >
                    <span>{i + 1}</span>
                    {list.slice(0, 2).map((e) => (
                      <small key={e.id}>{e.title}</small>
                    ))}
                    {list.length > 2 && <small>+{list.length - 2} más</small>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="agenda-heading">
            <h3>
              {selected
                ? `Agenda del ${dateLabel(selected)}`
                : "Agenda del mes"}
            </h3>
            {selected && (
              <button className="text-link" onClick={() => setSelected("")}>
                Ver todo el mes
              </button>
            )}
          </div>
          <p className="muted">
            Las tradiciones sin fecha se encuentran en la vista de tarjetas.
          </p>
          {agenda.length ? (
            <EventGrid events={agenda} />
          ) : (
            <Empty title="Un espacio para nuevas historias">
              <p>
                No hay eventos para {selected ? "este día" : "este mes"} con los
                filtros actuales.
              </p>
            </Empty>
          )}
        </>
      )}
    </div>
  );
}
import { useEffect } from "react";
import { api } from "../services/api";
function useCalendarEvents(filters) {
  const query = queryString({ ...filters, limit: 100, page: undefined });
  const [state, setState] = useState({ loading: true, data: null, error: "" }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: "" });
    (async () => {
      const first = await api(`/events?${query}`);
      const rows = [...first.events];
      for (let p = 2; p <= first.pages; p++) {
        const next = await api(`/events?${query}&page=${p}`);
        rows.push(...next.events);
      }
      if (active) setState({ loading: false, data: rows, error: "" });
    })().catch((e) => {
      if (active) setState({ loading: false, data: null, error: e.message });
    });
    return () => {
      active = false;
    };
  }, [query, revision]);
  return { ...state, reload: () => setRevision((r) => r + 1) };
}
