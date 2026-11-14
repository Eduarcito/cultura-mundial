import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { Globe2, Heart, Menu, X, ArrowUpRight, UserRound } from "lucide-react";
import { useApp } from "../context/AppContext";
import { SearchBox } from "./UI";
export default function Layout() {
  const { user } = useApp(),
    [menu, setMenu] = useState(false);
  const location = useLocation();
  const exploring = location.pathname === "/explorar";
  const calendar = new URLSearchParams(location.search).get("vista") === "calendario";
  useEffect(() => {
    setMenu(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link
            to="/"
            className="brand"
            aria-label="Cultura sin fronteras, inicio"
          >
            <Globe2 className="brand-icon" size={35} />
            <span>
              cultura<span>sin fronteras</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            <NavLink to="/" end>
              Inicio
            </NavLink>
            <Link to="/explorar" className={exploring && !calendar ? "active" : ""} aria-current={exploring && !calendar ? "page" : undefined}>Explorar</Link>
            <Link to="/explorar?vista=calendario" className={exploring && calendar ? "active" : ""} aria-current={exploring && calendar ? "page" : undefined}>Calendario</Link>
          </nav>
          <div className="header-search">
            <SearchBox compact />
          </div>
          <div className="header-actions">
            <Link
              to="/guardados"
              className="icon-btn desktop-save"
              aria-label="Mis guardados"
            >
              <Heart size={20} />
            </Link>
            <Link to="/cuenta" className="account-link">
              <UserRound size={17} />
              <span>{user ? user.name.split(" ")[0] : "Mi cuenta"}</span>
            </Link>
            <button
              className="icon-btn mobile-menu"
              aria-label={menu ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav" aria-label="Navegación móvil">
            <Link to="/">Inicio</Link>
            <Link to="/explorar">Explorar</Link>
            <Link to="/explorar?vista=calendario">Calendario</Link>
            <Link to="/guardados">Mis guardados</Link>
            <Link to="/proponer">Proponer un evento</Link>
          </nav>
        )}
      </header>
      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <div className="footer-top">
          <div>
            <Link to="/" className="brand">
              <Globe2 size={32} />
              <span>
                cultura<span>sin fronteras</span>
              </span>
            </Link>
            <p>
              El mundo tiene mucho que contarte.
              <br />
              Empieza por una historia.
            </p>
          </div>
          <div>
            <span className="eyebrow">Tu próxima conexión</span>
            <Link to="/explorar">Explorar culturas</Link>
            <Link to="/guardados">Mis guardados</Link>
          </div>
          <div>
            <span className="eyebrow">Una comunidad curiosa</span>
            <Link to="/proponer">
              Proponer un evento <ArrowUpRight size={14} />
            </Link>
            <Link to="/creditos">Fuentes y fotografías</Link>
            {user?.role === "admin" && <Link to="/admin">Administración</Link>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Cultura sin fronteras</span>
          <span>Hecho para descubrir. Creado para conectar.</span>
        </div>
      </footer>
    </>
  );
}
