import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import GoldmanSachs from "../DocHubAssets/HomePageAssets/GoldmanSachs.png";
import GoldmanSachsV1 from "../DocHubAssets/HomePageAssets/GoldmanSachsV1.png";

export default function Header() {
  const location = useLocation();
  const [useLightHeaderLogo, setUseLightHeaderLogo] = useState(false);

  useEffect(() => {
    const b = document?.body;
    const isVendor = b?.dataset?.vendorPage === "true";
    const vendorTheme = b?.dataset?.vendorTheme; // "dark" means vendor page theme is dark => header becomes white via CSS
    setUseLightHeaderLogo(Boolean(isVendor && vendorTheme === "dark"));
  }, [location.pathname]);

  const logoSrc = useLightHeaderLogo ? GoldmanSachsV1 : GoldmanSachs;

  return (
    <header className="topHeader">
      <div className="headerInner">
        <Link to="/" className="brand">
          <div className="brandLogoBox">
            <img
              src={logoSrc}
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
