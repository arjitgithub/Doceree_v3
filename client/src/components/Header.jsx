import React from "react";
import { Link, useLocation } from "react-router-dom";
import gsLogo from "../DocHubAssets/WebAppLogos/GS_logo.png";

export default function Header() {
  const location = useLocation();

  return (
    <header className="topHeader">
      <div className="headerInner">
        <Link to="/" className="brand">
          <div className="brandLogoBox">
            <img
              src={gsLogo}
              alt="Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </Link>

        <nav className="navLinks">
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Home
          </Link>

          <Link
            className={location.pathname.startsWith("/catalog") ? "active" : ""}
            to="/catalog"
          >
            Marketplace
          </Link>

          <a href="#" onClick={(e) => e.preventDefault()}>
            GSWeb
          </a>
        </nav>

        {/* far right */}
        <Link className="loginBtn" to="/admin">Login</Link>
      </div>
    </header>
  );
}