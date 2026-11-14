import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Loading, ErrorState } from "./UI";
export default function Protected({ admin = false }) {
  const { user, ready, sessionError, refreshSession } = useApp(),
    location = useLocation();
  if (!ready) return <Loading />;
  if (sessionError)
    return <ErrorState message={sessionError} retry={refreshSession} />;
  if (!user)
    return (
      <Navigate
        to="/cuenta"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (admin && user.role !== "admin")
    return (
      <div className="container page">
        <ErrorState message="Esta página requiere permisos de administración." />
      </div>
    );
  return <Outlet />;
}
