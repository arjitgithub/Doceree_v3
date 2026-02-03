import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="appShell">
      {!isHome && <Header />}

      {isHome ? (
        <Outlet />
      ) : (
        <main className="mainContent">
          <Outlet />
        </main>
      )}
    </div>
  );
}
