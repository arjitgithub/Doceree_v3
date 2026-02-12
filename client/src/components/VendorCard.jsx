import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function toLogoCandidates(fileName) {
  if (!fileName) return [];

  const clean = String(fileName).trim();
  if (!clean) return [];

  // If an extension is already provided, use it as-is.
  if (/\.(png|jpe?g|svg|webp)$/i.test(clean)) return [clean];

  // Otherwise, try common raster formats.
  return [`${clean}.png`, `${clean}.jpg`, `${clean}.jpeg`];
}

function logoUrl(fileName) {
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
  const parentCompany = vendor.VENDOR_PARENT_COMPANY;
  const desc = vendor.tagline || vendor.VENDOR_TILE_DESC || "";

  const logoCandidates = useMemo(() => toLogoCandidates(vendor.VENDOR_TILE_LOGO), [vendor.VENDOR_TILE_LOGO]);
  const [logoIdx, setLogoIdx] = useState(0);
  const logoSrc = logoCandidates.length ? logoUrl(logoCandidates[logoIdx]) : null;

  return (
    <Link
      className="vendorTile"
      to={`/vendor/${routeId}`}
      state={{ vendor }}
      style={{ ["--tileBg"]: bg, color: text, position: "relative" }}
      aria-label={vendorName}
    >
      {/* Task 5: keep this permanently visible (not hover-only) */}
      <div className="vendorTileKicker" style={{ opacity: 1, visibility: "visible", display: "block" }}>
        Vendor Data Product
      </div>

      <div className="vendorTileMain">
        <div className="vendorTileIconBox" aria-hidden="true">
          {logoSrc ? (
            <img
              className="vendorTileIconImg"
              src={logoSrc}
              alt=""
              onError={(e) => {
                // Try png/jpg/jpeg fallbacks before hiding the image.
                if (logoIdx + 1 < logoCandidates.length) {
                  setLogoIdx((i) => i + 1);
                  return;
                }
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </div>

        <div className="vendorTileTextStack">
          <div className="vendorTileTitle">{vendorName}</div>
          {parentCompany ? <div className="vendorTileParent">{parentCompany}</div> : null}
          {desc ? <div className="vendorTileDesc">{desc}</div> : null}
        </div>
      </div>

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
    </Link>
  );
}
