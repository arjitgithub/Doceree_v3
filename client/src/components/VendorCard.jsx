import React from "react";
import { Link } from "react-router-dom";

function getLogoSrc(fileName) {
  if (!fileName) return null;
  try {
    return new URL(`../DocHubAssets/VendorTileLogo/${fileName}`, import.meta.url).href;
  } catch {
    return null;
  }
}

export default function VendorCard({ vendor }) {
  const bg = vendor.VENDOR_BKG_COLOR || "#DFF3E8";
  const text = vendor.VENDOR_NAME_TEXT_COLOR || "#0a0a0a";

  const routeId = vendor.slug || vendor.VENDOR_ID;
  const vendorName = vendor.name || vendor.VENDOR_NAME;
  const desc = vendor.tagline || vendor.VENDOR_TILE_DESC || "";
  const logoSrc = getLogoSrc(vendor.VENDOR_TILE_LOGO);

  return (
    <Link
      className="vendorTile"
      to={`/vendor/${routeId}`}
      state={{ vendor }}
      style={{ ["--tileBg"]: bg, color: text }}
      aria-label={vendorName}
    >
      <div className="vendorTileTop">
        <div className="vendorTileKicker">Vendor Data Product</div>

        <div className="vendorTileLogoSlot">
          {logoSrc ? (
            <img
              className="vendorTileLogoImg"
              src={logoSrc}
              alt={`${vendorName} logo`}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </div>

        <div className="vendorTileTextBottom">
          <div className="vendorTileTitle">{vendorName}</div>
          <div className="vendorTileDesc">{desc}</div>
        </div>
      </div>

      <div className="vendorTileBottom">
        <div className="vendorTileCta" aria-hidden="true">
          <svg className="vendorTileArrow" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M10 7L15 12L10 17"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
