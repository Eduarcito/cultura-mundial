import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Music2,
  Utensils,
  Palette,
  Flower2,
  PartyPopper,
  Sparkles,
  MapPin,
} from "lucide-react";
import { useResource } from "../services/useResource";
import {
  Image,
  SearchBox,
  SurpriseButton,
  SectionHeading,
  EventGrid,
  Loading,
  ErrorState,
  Empty,
  today,
  categories,
} from "../components/UI";
const icons = [Sparkles, Utensils, Music2, Palette, Flower2, PartyPopper];
const countries = [
  {
    name: "Guatemala",
    region: "Centroamérica",
    image: "antigua",
    caption: "Arco de Santa Catalina, Antigua Guatemala",
  },
  {
    name: "Japón",
    region: "Asia",
    image: "japan",
    caption: "Faroles en una celebración japonesa",
  },
  {
    name: "México",
    region: "América del Norte",
    image: "oaxaca",
    caption: "Papel picado en Oaxaca",
  },
  {
    name: "Marruecos",
    region: "África",
    image: "spices",
    caption: "Especias en un mercado de Marrakech",
  },
];
export default function Home() {
  const { data, loading, error, reload } = useResource(
    `/events?limit=3&kind=edition&from=${today()}`,
  );
  const tradition = useResource("/events?kind=tradition&limit=1");
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="little-line" /> UN MUNDO DE HISTORIAS POR VIVIR
          </p>
          <h1>
            Descubre las culturas que <em>conectan al mundo.</em>
          </h1>
          <p className="hero-description">
            Hay un mundo más allá de los mapas. Acércate a sus tradiciones,
            celebra sus historias y encuentra tu próxima conexión.
          </p>
          <SearchBox />
          <div className="hero-bottom">
            <span>
              <Compass size={17} /> Sigue tu curiosidad
            </span>
            <SurpriseButton className="text-link" />
          </div>
        </div>
        <div className="hero-visual">
          <Image
            src="/images/oaxaca.webp"
            alt="Papel picado de colores sobre una calle de Oaxaca al anochecer"
            eager
          />
          <div className="hero-image-shade" />
          <span className="hero-top-label">
            <span /> CULTURA QUE SE VIVE
          </span>
          <div className="hero-caption">
            <p>
              <MapPin size={14} /> Oaxaca, México
            </p>
            <h2>
              Cada lugar,
              <br />
              una forma de sentir.
            </h2>
            <Link
              to="/explorar?country=M%C3%A9xico"
              className="round-arrow"
              aria-label="Explorar México"
            >
              <ArrowUpRight />
            </Link>
          </div>
          <span className="photo-credit">Foto: ayumi kubo / Unsplash</span>
          <div className="hero-stamp">
            MIRA CERCA
            <br />
            <GlobeMark />
            <span>VIAJA LEJOS</span>
          </div>
        </div>
      </section>
      <section className="category-strip" aria-label="Explorar por categoría">
        {categories.map((c, i) => {
          const Icon = icons[i];
          return (
            <Link key={c} to={`/explorar?category=${encodeURIComponent(c)}`}>
              <span>
                <Icon size={23} strokeWidth={1.5} />
              </span>
              {c}
              <ArrowUpRight size={14} />
            </Link>
          );
        })}
      </section>
      <section className="section container">
        <SectionHeading
          eyebrow="LA CULTURA NO SE DETIENE"
          title="Lo próximo por descubrir"
          link="Ver todos los eventos"
          to="/explorar"
        />
        <p className="section-intro">
          Encuentros que acercan personas, lugares e historias.
        </p>
        <p className="demo-disclaimer">
          Estás explorando una primera versión. Las ediciones marcadas como
          «Ejemplo» son ficticias.
        </p>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : data?.events.length ? (
          <EventGrid events={data.events} />
        ) : (
          <Empty title="Pronto habrá nuevos encuentros">
            <Link className="text-link" to="/explorar">
              Explorar todas las historias <ArrowRight size={16} />
            </Link>
          </Empty>
        )}
      </section>
      <section className="country-section">
        <div className="container">
          <SectionHeading
            eyebrow="DE AQUÍ, DE ALLÁ, DE TODAS PARTES"
            title="Elige un lugar. Encuentra una historia."
            link="Explorar el mundo"
            to="/explorar"
          />
          <div className="country-grid">
            {countries.map((c) => (
              <Link
                key={c.name}
                to={`/explorar?country=${encodeURIComponent(c.name)}`}
                className="country-card"
              >
                <Image src={`/images/${c.image}-small.webp`} alt={c.caption} />
                <div>
                  <span>{c.region}</span>
                  <h3>{c.name}</h3>
                </div>
                <ArrowUpRight size={22} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container tradition-section">
        <div className="tradition-image">
          <Image
            src="/images/antigua.webp"
            alt="El Arco de Santa Catalina en Antigua Guatemala, imagen de contexto regional"
          />
          <span>GUATEMALA · PATRIMONIO VIVO</span>
        </div>
        <div className="tradition-copy">
          <p className="eyebrow">DESCUBRE UNA TRADICIÓN</p>
          <h2>
            Hay historias que
            <br />
            aprenden a volar.
          </h2>
          <p>
            En Santiago Sacatepéquez y Sumpango, manos de distintas generaciones
            dan forma a barriletes gigantes. Papel, memoria y comunidad que
            miran hacia el cielo.
          </p>
          <p className="muted">
            Una mirada a la técnica artesanal reconocida por la UNESCO, sin
            asociarla a una edición concreta.
          </p>
          {tradition.loading ? (
            <Loading />
          ) : tradition.error ? (
            <ErrorState message={tradition.error} retry={tradition.reload} />
          ) : tradition.data?.events[0] ? (
            <Link
              to={`/eventos/${tradition.data.events[0].id}`}
              className="btn"
            >
              Conocer la tradición <ArrowRight size={17} />
            </Link>
          ) : (
            <Link to="/explorar?kind=tradition" className="btn">
              Explorar tradiciones <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </section>
      <section className="community-banner container">
        <div>
          <p className="eyebrow">LAS MEJORES HISTORIAS SE COMPARTEN</p>
          <h2>Tu cultura también tiene un lugar aquí.</h2>
          <p>
            Ayúdanos a descubrir los encuentros que hacen especial a tu
            comunidad.
          </p>
        </div>
        <Link className="btn cream" to="/proponer">
          Proponer un evento <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
function GlobeMark() {
  return <Compass size={32} strokeWidth={1} />;
}
