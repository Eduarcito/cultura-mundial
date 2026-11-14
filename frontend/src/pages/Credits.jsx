import { Link } from "react-router-dom";
export default function Credits() {
  return (
    <div className="container page narrow prose">
      <p className="eyebrow">EL ORIGEN DE CADA HISTORIA</p>
      <h1>Fuentes y fotografías</h1>
      <h2>Una primera versión, con transparencia</h2>
      <p>
        Las ediciones iniciales son ejemplos ficticios y muestran esa etiqueta
        en sus tarjetas y fichas. Sus fechas, actividades y lugares ilustran el
        funcionamiento de la plataforma. No constituyen convocatorias reales.
      </p>
      <p>
        La historia sobre los barriletes gigantes se basa en la{" "}
        <a
          href="https://ich.unesco.org/en/decisions/19.COM/7.B.41"
          target="_blank"
          rel="noreferrer"
        >
          decisión 19.COM 7.B.41 de la UNESCO
        </a>
        . Describe una tradición general, sin inventar fechas de una edición.
        Revisión editorial: 14 de noviembre de 2026.
      </p>
      <h2>Fotografías con autoría</h2>
      <p>
        Imágenes bajo{" "}
        <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">
          Unsplash License
        </a>
        . Se conservan copias optimizadas en WebP. Las fotografías aportan
        contexto y no documentan los eventos ficticios.
      </p>
      <ul>
        <li>
          Antigua Guatemala:{" "}
          <a href="https://unsplash.com/photos/a-clock-tower-with-a-mountain-in-the-background-XOSMdXIWk_I">
            By Topo
          </a>
          .
        </li>
        <li>
          Faroles japoneses:{" "}
          <a href="https://unsplash.com/photos/glowing-japanese-lanterns-at-a-night-festival-guEJrCgWtGs">
            ayumi kubo
          </a>
          .
        </li>
        <li>
          Papel picado en Oaxaca:{" "}
          <a href="https://unsplash.com/photos/colorful-banners-strung-across-a-street-at-dusk-WE4aEV8NYAE">
            ayumi kubo
          </a>
          .
        </li>
        <li>
          Mercado de especias de Marrakech:{" "}
          <a href="https://unsplash.com/photos/a-variety-of-colorful-bags-filled-with-different-types-of-spices-_n9PLGmJq9Y">
            Andy Kennedy
          </a>
          .
        </li>
      </ul>
      <h2>Revisión de la información</h2>
      <p>
        Cada ficha indica su fuente y la fecha de revisión. No hay conexiones a
        agendas externas ni actualizaciones automáticas. Si una fuente deja de
        estar disponible, la ficha conserva la información y la fecha de su
        última revisión editorial.
      </p>
      <h2>Participar con respeto</h2>
      <p>
        Las propuestas se revisan antes de publicarse. Buscamos descripciones
        específicas, autoría reconocida y fuentes comprobables, respetando que
        una comunidad no representa a todas las personas de un país.
      </p>
      <Link className="btn" to="/proponer">
        Compartir una historia
      </Link>
    </div>
  );
}
