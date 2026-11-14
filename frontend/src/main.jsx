import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import Protected from "./components/Protected";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Detail from "./pages/Detail";
import Account from "./pages/Account";
import Saved from "./pages/Saved";
import { Propose, Proposals } from "./pages/Proposals";
import { Admin, AdminEdit } from "./pages/Admin";
import Credits from "./pages/Credits";
import "./styles.css";
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="state" role="alert">
        <h1>Algo interrumpió el viaje.</h1>
        <p>Recarga la página para volver a intentarlo.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Recargar
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explorar" element={<Explore />} />
            <Route path="eventos/:id" element={<Detail />} />
            <Route path="cuenta" element={<Account />} />
            <Route path="creditos" element={<Credits />} />
            <Route element={<Protected />}>
              <Route path="guardados" element={<Saved />} />
              <Route path="proponer" element={<Propose />} />
              <Route path="propuestas" element={<Proposals />} />
            </Route>
            <Route element={<Protected admin />}>
              <Route path="admin" element={<Admin />} />
              <Route path="admin/nuevo" element={<AdminEdit />} />
              <Route path="admin/editar/:id" element={<AdminEdit />} />
            </Route>
            <Route
              path="*"
              element={
                <div className="state">
                  <h1>Este camino aún no existe.</h1>
                  <Link className="btn" to="/">
                    Volver al inicio
                  </Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  </ErrorBoundary>,
);
