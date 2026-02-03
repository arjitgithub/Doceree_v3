import React from "react";
import { Link } from "react-router-dom";
import { getVendorTheme } from "../DocHubLayoutDesign/vendorTheme.js";

export default function VendorCard({ vendor }) {
  const theme = getVendorTheme(vendor.slug);

  return (
    <Link
      to={`/vendors/${vendor.slug}`}
      className="vendorTile"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div className="vendorTileLeft">
        <div className="vendorTileTitle">{vendor.name}</div>
        {vendor.tagline ? <div className="vendorTileSub">{vendor.tagline}</div> : null}
      </div>

      <div className="vendorTileRight">
        <div className="vendorTileIcon" aria-hidden="true">⬡</div>
      </div>
    </Link>
  );
}
